// src/controllers/google-calendar.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { GoogleCalendarService } from '../services/google-calendar.service';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('auth')
  getAuthUrl() {
    const url = this.googleCalendarService.getAuthUrl();
    return { url };
  }

  @Get('oauth-callback')
  async handleCallback(@Query('code') code: string) {
    const tokens = await this.googleCalendarService.getTokens(code);
    // In a real app, you'd want to save the refresh token to your database
    // and associate it with the user who authorized the application
    return { success: true, tokens };
  }

  @Post('events')
  async addEvent(@Body() eventData: any) {
    return await this.googleCalendarService.addEvent(eventData);
  }

  @Post('events/:eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() eventData: any,
    @Query('calendarId') calendarId?: string,
  ) {
    return await this.googleCalendarService.updateEvent(
      eventId,
      eventData,
      calendarId || 'primary',
    );
  }

  @Delete('events/:eventId')
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Query('calendarId') calendarId?: string,
  ) {
    await this.googleCalendarService.deleteEvent(
      eventId,
      calendarId || 'primary',
    );
    return { success: true };
  }
}
