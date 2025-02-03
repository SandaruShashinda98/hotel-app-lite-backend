import { Module } from '@nestjs/common';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingSchema } from './schemas/booking.schema';
import { BookingController } from './controllers/booking.controller';
import { BookingService } from './services/booking.service';
import { BookingDatabaseService } from './services/booking.database.service';

const services = [BookingDatabaseService, BookingService];
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_COLLECTION_NAMES.BOOKINGS,
        schema: BookingSchema,
      },
    ]),
  ],
  controllers: [BookingController],
  providers: services,
  exports: services,
})
export class BookingModule {}
