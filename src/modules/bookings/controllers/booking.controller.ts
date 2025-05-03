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
    // this.logger.log(`Syncing bookings from ${fromDate} to ${toDate}`);
    const data = await this.bookingComService.fetchReservations(
      fromDate,
      toDate,
    );

    console.log('data', data);
  }

  @ApiOperation({
    summary: 'Get single booking',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.VIEW_BOOKINGS)
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

    // If the booking is confirmed, update room status
    if (newBooking.status === 'confirmed') {
      await this.bookingService.handleBookingStatusChange(
        new Types.ObjectId(newBooking._id),
        'confirmed',
      );
    }

    await this.bookingService.createCalenderEvent(newBooking);

    return { data: newBooking };
  }

  @ApiOperation({ summary: 'Update checking state' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch('check/:id')
  async updateCheckInState(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: IBooking,
  ) {
    // If room or dates are being changed, check availability
    const currentBooking = await this.bookingDatabaseService.findById(
      pathParams.id,
    );

    if (!currentBooking) {
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);
    }

    const updatedBooking =
      await this.bookingDatabaseService.findBookingByIdAndUpdate(
        new Types.ObjectId(pathParams.id),
        { ...currentBooking, ...updateData },
        loggedUser,
      );

    if (!updatedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    if (updatedBooking.is_checked_in || updatedBooking.is_checked_out) {
      await this.emailService.sendCheckInCheckoutEmail(updatedBooking);
    }

    return { data: updatedBooking };
  }

  @ApiOperation({ summary: 'Update booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch(':id')
  async updateBooking(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: IBooking,
  ) {
    console.log('updateData', updateData);
    // If room or dates are being changed, check availability
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

    const updatedBooking =
      await this.bookingDatabaseService.findBookingByIdAndUpdate(
        new Types.ObjectId(pathParams.id),
        { ...currentBooking, ...updateData },
        loggedUser,
      );

    if (!updatedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

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
