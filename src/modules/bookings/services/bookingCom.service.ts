import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as xml2js from 'xml2js';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BookingComService {
  private readonly logger = new Logger(BookingComService.name);
  private readonly apiUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly authHeader: string;
  
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('BOOKING_API_URL');
    this.username = this.configService.get<string>('BOOKING_USERNAME');
    this.password = this.configService.get<string>('BOOKING_PASSWORD');
    
    // Create the Base64-encoded credentials for Basic Auth
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
    
    this.logger.log('BookingComService initialized');
  }

  /**
   * Fetches reservations from Booking.com API
   * @param fromDate Start date in YYYY-MM-DD format
   * @param toDate End date in YYYY-MM-DD format
   * @returns Array of bookings
   */
  async fetchReservations(fromDate: string, toDate: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching reservations from ${fromDate} to ${toDate}`);
      
      const response = await this.httpService.get(
        `${this.apiUrl}/reservations`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml'
          },
          params: {
            arrival_date_from: fromDate,
            arrival_date_to: toDate,
          },
        }
      ).toPromise();
      
      // Parse the XML response
      const bookings = await this.parseReservationsXml(response.data);
      this.logger.log(`Retrieved ${bookings.length} reservations from Booking.com`);
      
      return bookings;
    } catch (error) {
      this.logger.error(`Error fetching reservations from Booking.com: ${error.message}`);
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Tests the connection to Booking.com API
   * @returns Success status
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch a small amount of data just to test the connection
      await this.httpService.get(
        `${this.apiUrl}/hotels`, // Use an appropriate test endpoint
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml'
          }
        }
      ).toPromise();
      
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Parse XML data from Booking.com's response
   * @param xmlData The XML response from Booking.com
   * @returns Structured booking data
   */
  private async parseReservationsXml(xmlData: string): Promise<any[]> {
    try {
      const parser = new xml2js.Parser({ 
        explicitArray: false, 
        mergeAttrs: true 
      });
      
      const result = await parser.parseStringPromise(xmlData);
      
      // Log the structure to debug
      this.logger.debug(`XML parsing result: ${JSON.stringify(result).substring(0, 200)}...`);
      
      // The exact structure depends on Booking.com's API response
      if (result.reservations && result.reservations.reservation) {
        // Handle both single reservation and array of reservations
        const reservations = Array.isArray(result.reservations.reservation) 
          ? result.reservations.reservation 
          : [result.reservations.reservation];
          
        return reservations.map(res => {
          // Transform to our application's booking structure
          return {
            id: res.id,
            guest_name: `${res.guest?.first_name || ''} ${res.guest?.last_name || ''}`.trim(),
            guest_email: res.guest?.email || '',
            guest_phone: res.guest?.telephone || '',
            arrival_date: res.arrival_date,
            departure_date: res.departure_date,
            room_type: res.room_type || res.room?.type_name,
            adults: parseInt(res.number_of_guests?.adults || '0', 10),
            children: parseInt(res.number_of_guests?.children || '0', 10),
            price: parseFloat(res.price?.value || '0'),
            currency: res.price?.currency || 'EUR',
            status: res.status,
            created_at: res.created_timestamp,
            modified_at: res.modified_timestamp,
            source: 'booking.com'
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
   * Get available room types from Booking.com
   */
  async getRoomTypes(): Promise<any[]> {
    try {
      const response = await this.httpService.get(
        `${this.apiUrl}/room_types`,
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml'
          }
        }
      ).toPromise();
      
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
        mergeAttrs: true 
      });
      
      const result = await parser.parseStringPromise(xmlData);
      
      if (result.room_types && result.room_types.room_type) {
        const roomTypes = Array.isArray(result.room_types.room_type) 
          ? result.room_types.room_type 
          : [result.room_types.room_type];
          
        return roomTypes.map(room => {
          return {
            id: room.id,
            name: room.name,
            max_occupancy: parseInt(room.max_occupancy || '0', 10),
            description: room.description
          };
        });
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error parsing room types XML: ${error.message}`);
      return [];
    }
  }
}