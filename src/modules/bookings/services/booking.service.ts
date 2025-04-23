import { GetClockOutReasonQueryDTO } from '@dto/references/clock-out-query-param';
import { IUser } from '@interface/authorization/user';
import { IBooking } from '@interface/references/reference';
import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { GoogleCalendarService } from './google-calendar.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BookingService {
  constructor(
    private googleCalendarService: GoogleCalendarService,
    private httpService: HttpService,
  ) {}

  /**
   * This function generates filter criteria based on search key and ID for clock out
   * reasons.
   */
  getBookingFilters(queryParams: GetClockOutReasonQueryDTO) {
    const { searchKey, _id } = queryParams;

    const filterCriteria: FilterQuery<GetClockOutReasonQueryDTO> = {};

    filterCriteria.is_delete = false;

    if (searchKey)
      filterCriteria.customer_name = { $regex: searchKey, $options: 'i' };

    if (_id) filterCriteria._id = _id;

    return filterCriteria;
  }

  async createCalenderEvent(bookingData: IBooking) {
    // Save booking to your database...

    // Add event to Google Calendar
    const calendarEventData = {
      summary: `Booking: ${bookingData.customer_name} - Room ${bookingData.customer_name}`,
      description: `Guest`,
      start: bookingData.clock_in,
      end: bookingData.clock_out,
      location: `Room 4`,
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
