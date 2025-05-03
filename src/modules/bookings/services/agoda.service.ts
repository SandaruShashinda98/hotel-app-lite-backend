import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as xml2js from 'xml2js';

@Injectable()
export class AgodaService {
  private readonly logger = new Logger(AgodaService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly hotelId: string;
  private readonly authHeader: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('AGODA_API_URL');
    this.apiKey = this.configService.get<string>('AGODA_API_KEY');
    this.hotelId = this.configService.get<string>('AGODA_HOTEL_ID');

    // Setup authentication header (Agoda typically uses API key in header)
    this.authHeader = `ApiKey ${this.apiKey}`;

    this.logger.log('AgodaService initialized');
  }

  /**
   * Fetches reservations from Agoda API
   * @param fromDate Start date in YYYY-MM-DD format
   * @param toDate End date in YYYY-MM-DD format
   * @returns Array of bookings
   */
  async fetchReservations(fromDate: string, toDate: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching reservations from ${fromDate} to ${toDate}`);

      // Create request to Agoda API
      const response = await lastValueFrom(
        this.httpService.get(`${this.apiUrl}/reservations`, {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/xml',
            Accept: 'application/xml',
          },
          params: {
            hotelId: this.hotelId,
            checkInDateFrom: fromDate,
            checkInDateTo: toDate,
          },
        }),
      );

      // Parse the XML response
      const bookings = await this.parseReservationsXml(response.data);
      this.logger.log(`Retrieved ${bookings.length} reservations from Agoda`);

      return bookings;
    } catch (error) {
      this.logger.error(
        `Error fetching reservations from Agoda: ${error.message}`,
      );
      if (error.response) {
        this.logger.error(
          `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Tests the connection to Agoda API
   * @returns Success status
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch a small amount of data just to test the connection
      await lastValueFrom(
        this.httpService.get(
          `${this.apiUrl}/hotel/${this.hotelId}`, // Use an appropriate test endpoint
          {
            headers: {
              Authorization: this.authHeader,
              'Content-Type': 'application/xml',
              Accept: 'application/xml',
            },
          },
        ),
      );

      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse XML data from Agoda's response
   * @param xmlData The XML response from Agoda
   * @returns Structured booking data
   */
  private async parseReservationsXml(xmlData: string): Promise<any[]> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
      });

      const result = await parser.parseStringPromise(xmlData);

      // Log the structure to debug
      this.logger.debug(
        `XML parsing result: ${JSON.stringify(result).substring(0, 200)}...`,
      );

      // The exact structure depends on Agoda's API response
      if (result.bookings && result.bookings.booking) {
        // Handle both single booking and array of bookings
        const bookings = Array.isArray(result.bookings.booking)
          ? result.bookings.booking
          : [result.bookings.booking];

        return bookings.map((booking) => {
          // Transform to our application's booking structure
          return {
            id: booking.id,
            customer_name:
              `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.trim(),
            mobile_number: booking.guest?.phoneNumber || '',
            email: booking.guest?.email || '',
            clock_in: booking.checkInDate,
            clock_out: booking.checkOutDate,
            status: this.mapAgodaStatus(booking.status),
            notes: booking.specialRequests || '',
            room_type: booking.roomType || '',
            adults: parseInt(booking.guests?.adults || '0', 10),
            children: parseInt(booking.guests?.children || '0', 10),
            total_price: parseFloat(booking.price?.total || '0'),
            currency: booking.price?.currency || 'USD',
            source: 'agoda',
            created_at: booking.createdDate,
            updated_at: booking.modifiedDate,
          };
        });
      }

      return [];
    } catch (error) {
      this.logger.error(`Error parsing XML: ${error.message}`);
      return [];
    }
  }

  /**
   * Map Agoda booking status to your application's status
   * @param agodaStatus Status from Agoda
   * @returns Standardized status for your application
   */
  private mapAgodaStatus(agodaStatus: string): string {
    // Map Agoda-specific statuses to your application's status values
    switch (agodaStatus?.toLowerCase()) {
      case 'confirmed':
        return 'confirmed';
      case 'cancelled':
      case 'canceled':
        return 'canceled';
      case 'pending':
      case 'on request':
        return 'pending';
      case 'completed':
      case 'checked_out':
        return 'completed';
      default:
        return 'pending';
    }
  }

  /**
   * Get available room types from Agoda
   */
  async getRoomTypes(): Promise<any[]> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.apiUrl}/hotel/${this.hotelId}/rooms`, {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/xml',
            Accept: 'application/xml',
          },
        }),
      );

      // Parse the XML response for room types
      const roomTypes = await this.parseRoomTypesXml(response.data);
      return roomTypes;
    } catch (error) {
      this.logger.error(`Error fetching room types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse XML data for room types
   */
  private async parseRoomTypesXml(xmlData: string): Promise<any[]> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
      });

      const result = await parser.parseStringPromise(xmlData);

      if (result.rooms && result.rooms.room) {
        const roomTypes = Array.isArray(result.rooms.room)
          ? result.rooms.room
          : [result.rooms.room];

        return roomTypes.map((room) => {
          return {
            id: room.id,
            name: room.name,
            max_occupancy: parseInt(room.maxOccupancy || '0', 10),
            description: room.description,
          };
        });
      }

      return [];
    } catch (error) {
      this.logger.error(`Error parsing room types XML: ${error.message}`);
      return [];
    }
  }

  /**
   * Update a reservation status in Agoda
   * @param bookingId The Agoda booking ID
   * @param status New status for the booking
   */
  async updateBookingStatus(
    bookingId: string,
    status: string,
  ): Promise<boolean> {
    try {
      // Map your application status to Agoda status
      const agodaStatus = this.mapToAgodaStatus(status);

      const response = await lastValueFrom(
        this.httpService.post(
          `${this.apiUrl}/reservations/${bookingId}/status`,
          { status: agodaStatus },
          {
            headers: {
              Authorization: this.authHeader,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Error updating booking status: ${error.message}`);
      return false;
    }
  }

  /**
   * Map your application's status to Agoda status
   */
  private mapToAgodaStatus(appStatus: string): string {
    switch (appStatus.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed';
      case 'canceled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  }
}
