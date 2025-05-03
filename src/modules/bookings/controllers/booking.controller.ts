import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  InternalServerErrorException,
  Delete,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ObjectIDPathDTO } from '@common/dto/object-id.path.dto';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggedUser } from '@common/decorators/logged-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ILoggedUser } from '@interface/authorization/user';
import { Types } from 'mongoose';
import { BookingDatabaseService } from '../services/booking.database.service';
import { GetClockOutReasonQueryDTO } from '@dto/references/clock-out-query-param';
import { IBooking } from '@interface/references/reference';
import { BookingService } from '../services/booking.service';
import { PermissionGuard } from '@common/guards/permission.guard';
import { BookingComService } from '../services/bookingCom.service';
import { EmailService } from '@common/services/email.service';

@ApiTags('bookings')
@Controller({ path: 'bookings' })
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(
    private readonly bookingDatabaseService: BookingDatabaseService,
    private readonly bookingService: BookingService,
    private readonly emailService: EmailService,
    private readonly bookingComService: BookingComService,
  ) {}

  @ApiOperation({
    summary: 'Get all booking with filters and pagination',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get()
  async filterBooking(@Query() queryParams: GetClockOutReasonQueryDTO) {
    const filters = this.bookingService.getBookingFilters(queryParams);

    const foundBooking =
      await this.bookingDatabaseService.findBookingsWithRoomDetails(
        filters,
        queryParams.start || 0,
        queryParams.size || 0,
      );

    return foundBooking;
  }

  @ApiOperation({
    summary: 'Get available rooms for a date range',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('available-rooms')
  async getAvailableRooms(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    if (!checkIn || !checkOut) {
      throw new BadRequestException(
        'Check-in and check-out dates are required',
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const availableRooms = await this.bookingService.getAvailableRooms(
      checkInDate,
      checkOutDate,
    );

    return { data: availableRooms, count: availableRooms.length };
  }

  @Get('sync')
  async syncBookings(
    @Query('fromDate')
    fromDate: string = new Date().toISOString().split('T')[0],
    @Query('toDate')
    toDate: string = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  ) {
    const data = await this.bookingComService.fetchReservations(
      fromDate,
      toDate,
    );

    this.logger.log(`Synced ${data.length} bookings from external services`);
    return { message: 'Bookings synced successfully', count: data.length };
  }

  @ApiOperation({
    summary: 'Get single booking',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get(':id')
  async getSingleBooking(@Param() pathParams: ObjectIDPathDTO) {
    const foundBooking = await this.bookingDatabaseService.findById(
      pathParams.id,
    );

    if (!foundBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: foundBooking };
  }

  @ApiOperation({ summary: 'Create new booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Post()
  async createBooking(
    @Body() createBooking: IBooking,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    // Validate required fields for email notifications
    if (!createBooking.email) {
      throw new BadRequestException('Customer email is required for notifications');
    }

    // Verify that the room is available for the selected dates
    if (!createBooking.room_id) {
      throw new BadRequestException('Room selection is required');
    }

    const checkInDate = new Date(createBooking.clock_in);
    const checkOutDate = new Date(createBooking.clock_out);

    const availableRooms = await this.bookingService.getAvailableRooms(
      checkInDate,
      checkOutDate,
    );

    const isRoomAvailable = availableRooms.some(
      (room) => room._id.toString() === createBooking.room_id.toString(),
    );

    if (!isRoomAvailable) {
      throw new BadRequestException(
        'Selected room is not available for the chosen dates',
      );
    }

    const newBooking = await this.bookingDatabaseService.createNewBooking(
      createBooking,
      loggedUser,
    );

    if (!newBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    // Send booking confirmation email
    try {
      await this.emailService.sendBookingConfirmationEmail(newBooking);
      this.logger.log(`Booking confirmation email sent for booking ${newBooking._id}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email: ${error.message}`);
      // Continue processing even if email fails
    }

    // If the booking is confirmed, update room status
    if (newBooking.status === 'confirmed') {
      await this.bookingService.handleBookingStatusChange(
        new Types.ObjectId(newBooking._id),
        'confirmed',
      );
    }

    // Create Google Calendar event
    await this.bookingService.createCalenderEvent(newBooking);

    return { data: newBooking };
  }

  @ApiOperation({ summary: 'Update checking state' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch('check/:id')
  async updateCheckInState(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: Partial<IBooking>,
  ) {
    // Get current booking
    const currentBooking = await this.bookingDatabaseService.findById(
      pathParams.id,
    );

    if (!currentBooking) {
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);
    }

    // Update check-in/check-out timestamps if applicable
    if (updateData.is_checked_in && !currentBooking.is_checked_in) {
      updateData.checked_in_at = new Date();
    }
    
    if (updateData.is_checked_out && !currentBooking.is_checked_out) {
      updateData.checked_out_at = new Date();
    }

    // Update booking
    const updatedBooking =
      await this.bookingDatabaseService.findBookingByIdAndUpdate(
        new Types.ObjectId(pathParams.id),
        updateData,
        loggedUser,
      );

    if (!updatedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    // Send check-in/check-out notification email
    if (
      (updateData.is_checked_in && !currentBooking.is_checked_in) || 
      (updateData.is_checked_out && !currentBooking.is_checked_out)
    ) {
      try {
        await this.emailService.sendCheckInCheckoutEmail(updatedBooking);
        const checkType = updateData.is_checked_in ? 'check-in' : 'check-out';
        this.logger.log(`${checkType.charAt(0).toUpperCase() + checkType.slice(1)} email sent for booking ${updatedBooking._id}`);
      } catch (error) {
        this.logger.error(`Failed to send check-in/check-out email: ${error.message}`);
        // Continue processing even if email fails
      }
    }

    return { data: updatedBooking };
  }

  @ApiOperation({ summary: 'Update booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch(':id')
  async updateBooking(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: Partial<IBooking>,
  ) {
    // Get current booking
    const currentBooking = await this.bookingDatabaseService.findById(
      pathParams.id,
    );

    if (!currentBooking) {
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);
    }

    let needsAvailabilityCheck = false;

    // Check if dates or room_id are being changed
    if (updateData.clock_in || updateData.clock_out || updateData.room_id) {
      needsAvailabilityCheck = true;
    }

    if (needsAvailabilityCheck) {
      const checkInDate = new Date(
        updateData.clock_in || currentBooking.clock_in,
      );
      const checkOutDate = new Date(
        updateData.clock_out || currentBooking.clock_out,
      );
      const roomId = updateData.room_id || currentBooking.room_id;

      const availableRooms = await this.bookingService.getAvailableRooms(
        checkInDate,
        checkOutDate,
      );

      // When checking availability for an update, we need to exclude the current booking
      const overlappingBookings =
        await this.bookingDatabaseService.findOverlappingBookings(
          checkInDate,
          checkOutDate,
          pathParams.id,
        );

      const isRoomAvailable =
        availableRooms.some(
          (room) => room._id.toString() === roomId.toString(),
        ) ||
        !overlappingBookings.some(
          (booking) => booking.room_id.toString() === roomId.toString(),
        );

      if (!isRoomAvailable) {
        throw new BadRequestException(
          'Selected room is not available for the chosen dates',
        );
      }
    }

    // Track if status is changing
    const isStatusChanging = updateData.status && updateData.status !== currentBooking.status;
    const oldStatus = currentBooking.status;
    
    // Set last modified date
    updateData.last_modified_on = new Date();
    updateData.changed_by = loggedUser._id;
    
    // Update booking
    const updatedBooking =
      await this.bookingDatabaseService.findBookingByIdAndUpdate(
        new Types.ObjectId(pathParams.id),
        updateData,
        loggedUser,
      );

    if (!updatedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    // Send appropriate email notification based on update type
    try {
      if (isStatusChanging && updatedBooking.status === 'canceled') {
        // If status changed to cancelled, send cancellation email
        await this.emailService.sendBookingCancellationEmail(updatedBooking);
        this.logger.log(`Booking cancellation email sent for booking ${updatedBooking._id}`);
      } else {
        // For all other updates, send update notification
        await this.emailService.sendBookingUpdateEmail(updatedBooking);
        this.logger.log(`Booking update email sent for booking ${updatedBooking._id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send booking update email: ${error.message}`);
      // Continue processing even if email fails
    }

    // If status changed to confirmed/cancelled, update room status
    if (isStatusChanging) {
      await this.bookingService.handleBookingStatusChange(
        new Types.ObjectId(updatedBooking._id),
        updatedBooking.status,
        oldStatus,
      );
    }

    return { data: updatedBooking };
  }

  @ApiOperation({ summary: 'Delete booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Delete(':id')
  async DeleteBooking(
    @Param() pathParams: ObjectIDPathDTO,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    // Get the booking to check its status
    const booking = await this.bookingDatabaseService.findById(pathParams.id);

    if (!booking) {
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);
    }

    // Send cancellation email before deleting
    try {
      await this.emailService.sendBookingCancellationEmail(booking);
      this.logger.log(`Booking cancellation email sent for deleted booking ${booking._id}`);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation email: ${error.message}`);
      // Continue processing even if email fails
    }

    // If the booking was confirmed, we need to update the room status
    if (booking.status === 'confirmed') {
      await this.bookingService.handleBookingStatusChange(
        new Types.ObjectId(booking._id),
        'canceled',
        'confirmed',
      );
    }

    const deletedBooking = await this.bookingDatabaseService.hardDelete(
      pathParams.id,
    );

    if (!deletedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: deletedBooking };
  }
}