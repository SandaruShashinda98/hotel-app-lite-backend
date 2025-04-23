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
import { Permissions } from '@common/decorators/permissions.decorator';
import { BookingService } from '../services/booking.service';
import { PermissionGuard } from '@common/guards/permission.guard';
import { PERMISSIONS } from '@constant/authorization/roles';
import { BookingComService } from '../services/bookingCom.service';

@ApiTags('bookings')
@Controller({ path: 'bookings' })
export class BookingController {
  constructor(
    private readonly bookingDatabaseService: BookingDatabaseService,
    private readonly bookingService: BookingService,
    private readonly bookingComService: BookingComService,
  ) {}

  @ApiOperation({
    summary: 'Get all booking with filters and pagination',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Get()
  async filterBooking(@Query() queryParams: GetClockOutReasonQueryDTO) {
    const filters = this.bookingService.getBookingFilters(queryParams);

    const foundBooking =
      await this.bookingDatabaseService.filterDocumentsWithPagination(
        filters,
        queryParams.start || 0,
        queryParams.size || 0,
      );

    return foundBooking;
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
  @Permissions(PERMISSIONS.ADMIN)
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
  @Permissions(PERMISSIONS.ADMIN)
  @Post()
  async createBooking(
    @Body() createBooking: IBooking,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    const newBooking = await this.bookingDatabaseService.createNewBooking(
      createBooking,
      loggedUser,
    );

    console.log('newBooking', newBooking);

    if (!newBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    await this.bookingService.createCalenderEvent(newBooking);

    return { data: newBooking };
  }

  @ApiOperation({ summary: 'Update booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Patch(':id')
  async updateBooking(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: IBooking,
  ) {
    const updatedBooking =
      await this.bookingDatabaseService.findBookingByIdAndUpdate(
        new Types.ObjectId(pathParams.id),
        updateData,
        loggedUser,
      );

    if (!updatedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: updatedBooking };
  }

  @ApiOperation({ summary: 'Delete booking' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Delete(':id')
  async DeleteBooking(@Param() pathParams: ObjectIDPathDTO) {
    const deletedBooking = await this.bookingDatabaseService.hardDelete(
      pathParams.id,
    );

    if (!deletedBooking)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: deletedBooking };
  }
}
