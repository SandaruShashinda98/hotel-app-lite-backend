import { GetClockOutReasonQueryDTO } from '@dto/references/clock-out-query-param';
import { IUser } from '@interface/authorization/user';
import { IBooking, IRoom } from '@interface/references/reference';
import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { GoogleCalendarService } from './google-calendar.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { RoomDatabaseService } from './room.database.service';
import { BookingDatabaseService } from './booking.database.service';

@Injectable()
export class BookingService {
  constructor(
    private googleCalendarService: GoogleCalendarService,
    private roomDatabaseService: RoomDatabaseService,
    private bookingDatabaseService: BookingDatabaseService,
    private httpService: HttpService,
  ) {}

  getBookingFilters(queryParams: any): any {
    const filters: any = {};

    // Search by customer name or mobile number
    if (queryParams.searchKey) {
      filters.$or = [
        { customer_name: { $regex: queryParams.searchKey, $options: 'i' } },
        { mobile_number: { $regex: queryParams.searchKey, $options: 'i' } },
      ];
    }

    // Filter by status
    if (queryParams.status) {
      filters.status = queryParams.status;
    }

    // Filter by date range
    if (queryParams.startDate) {
      filters.clock_in = { $gte: new Date(queryParams.startDate) };
    }

    if (queryParams.endDate) {
      filters.clock_out = { $lte: new Date(queryParams.endDate) };
    }

    // Filter by room
    if (queryParams.roomId) {
      filters.room_id = new Types.ObjectId(queryParams.roomId);
    }

    return filters;
  }

  async getAvailableRooms(checkIn: Date, checkOut: Date): Promise<IRoom[]> {
    // Get all rooms
    const allRooms = await this.roomDatabaseService.filterDocuments();

    // Find any bookings that overlap with the requested date range
    const conflictingBookings =
      await this.bookingDatabaseService.findOverlappingBookings(
        checkIn,
        checkOut,
      );

    // Get the room IDs that are already booked
    const bookedRoomIds = conflictingBookings.map((booking) =>
      booking.room_id.toString(),
    );

    // Filter out rooms that are already booked or under maintenance
    const availableRooms = allRooms.filter(
      (room) =>
        !bookedRoomIds.includes(room._id.toString()) &&
        room.status !== 'maintenance',
    );

    return availableRooms;
  }

  async updateRoomStatus(
    roomId: Types.ObjectId,
    status: string,
  ): Promise<void> {
    // Update the room status (via the room service)
    await this.roomDatabaseService.updateRoomStatus(
      roomId,
      status,
      null, // Normally this would be the logged user
    );
  }

  async handleBookingStatusChange(
    bookingId: Types.ObjectId,
    newStatus: string,
    oldStatus?: string,
  ): Promise<void> {
    const booking = await this.bookingDatabaseService.findById(
      bookingId.toString(),
    );

    if (!booking) {
      return;
    }

    const roomId = new Types.ObjectId(booking.room_id);

    // If status changed to confirmed, update room status to occupied
    if (newStatus === 'confirmed') {
      await this.updateRoomStatus(roomId, 'occupied');
    }
    // If status changed from confirmed to something else, update room status to available
    else if (oldStatus === 'confirmed') {
      await this.updateRoomStatus(roomId, 'available');
    }
  }

  async createCalenderEvent(bookingData: IBooking) {
    // Save booking to your database...
    console.log('bookingData', bookingData);
    // Add event to Google Calendar
    const calendarEventData = {
      summary: `Booking: ${bookingData.customer_name} - Mobile No ${bookingData.mobile_number}`,
      description: `Email- ${bookingData.email} Status: ${bookingData.status} - Notes: ${bookingData.note}`,
      start: bookingData.clock_in,
      end: bookingData.clock_out,
      location: `Room Booking`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'http://localhost:3100/api/google-calendar/events',
          calendarEventData,
        ),
      );

      // Save the event ID to your booking record
      const eventId = response.data.id;
      // Update your booking with eventId...
      console.log('Event created:', eventId);
      return { ...bookingData, googleCalendarEventId: eventId };
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      // Still return the booking even if calendar fails
      return bookingData;
    }
  }
}
