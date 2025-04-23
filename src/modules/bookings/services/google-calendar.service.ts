// src/services/google-calendar.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client;
  private calendar: calendar_v3.Calendar;

  constructor(private configService: ConfigService) {
    // Initialize OAuth2 client with your credentials
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI', 'http://localhost:3100/api/google-calendar/oauth-callback') // Make sure this matches exactly
    );

    // Set refresh token (if you have one stored)
    const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
    if (refreshToken) {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    // Initialize calendar
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent' // Forces to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Add an event to Google Calendar
   */
  async addEvent(eventData: {
    summary: string;
    description: string;
    start: Date | string;
    end: Date | string;
    location?: string;
    attendees?: { email: string }[];
    calendarId?: string;
  }) {
    try {
      const { summary, description, start, end, location = '', attendees = [], calendarId = 'primary' } = eventData;

      const event = {
        summary, 
        description,
        start: {
          dateTime: new Date(start).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(end).toISOString(),
          timeZone: 'UTC'
        },
        location,
        attendees
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event
      });

      return response.data;
    } catch (error) {
      console.error('Error adding event to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(
    eventId: string,
    eventData: any,
    calendarId = 'primary'
  ) {
    try {
      // Prepare start and end dates if they exist
      if (eventData.start) {
        eventData.start = {
          dateTime: new Date(eventData.start).toISOString(),
          timeZone: 'UTC'
        };
      }
      
      if (eventData.end) {
        eventData.end = {
          dateTime: new Date(eventData.end).toISOString(),
          timeZone: 'UTC'
        };
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        requestBody: eventData
      });

      return response.data;
    } catch (error) {
      console.error('Error updating event in Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(eventId: string, calendarId = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
      return true;
    } catch (error) {
      console.error('Error deleting event from Google Calendar:', error);
      throw error;
    }
  }
}