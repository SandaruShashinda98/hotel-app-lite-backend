import { Module } from '@nestjs/common';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingSchema } from './schemas/booking.schema';
import { BookingController } from './controllers/booking.controller';
import { BookingService } from './services/booking.service';
import { BookingDatabaseService } from './services/booking.database.service';
import { GoogleCalendarService } from './services/google-calendar.service';
import { GoogleCalendarController } from './controllers/google-calender.controller';
import { HttpModule } from '@nestjs/axios';
import { BookingComService } from './services/bookingCom.service';
import { RoomController } from './controllers/room.controller';
import { RoomDatabaseService } from './services/room.database.service';
import { RoomSchema } from './schemas/room.schema';
import { EmailService } from '@common/services/email.service';

const services = [
  BookingDatabaseService,
  GoogleCalendarService,
  BookingComService,
  BookingService,
  RoomDatabaseService,
  EmailService
];
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_COLLECTION_NAMES.BOOKINGS,
        schema: BookingSchema,
      },
      {
        name: DB_COLLECTION_NAMES.ROOMS,
        schema: RoomSchema,
      },
    ]),
    HttpModule
  ],
  controllers: [BookingController, GoogleCalendarController, RoomController],
  providers: services,
  exports: services,
})
export class BookingModule {}
