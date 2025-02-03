import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommonDatabaseService } from '@common/services/common.database.service';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { LogsDatabaseService } from '@module/activity-logs/services/logs.database.service';
import { ILoggedUser } from '@interface/authorization/user';
import { IBooking } from '@interface/references/reference';
import { IBookingModel } from '../schemas/booking.schema';

@Injectable()
export class BookingDatabaseService extends CommonDatabaseService<IBooking> {
  constructor(
    @InjectModel(DB_COLLECTION_NAMES.BOOKINGS)
    readonly BookingModel: Model<IBookingModel>,
    logsDatabaseService: LogsDatabaseService,
  ) {
    super(logsDatabaseService, BookingModel, DB_COLLECTION_NAMES.BOOKINGS);
  }

  async createNewBooking(
    data: Partial<IBooking>,
   loggedUser: ILoggedUser,
  ): Promise<IBooking | null> {
    try {
      const newBooking = new this.BookingModel({
        ...data,
       created_by: loggedUser._id,
      });

      const savedBooking = await newBooking.save();

      return savedBooking.toObject({ versionKey: false });
    } catch (err) {
      new Logger().debug(
        `booking.database.service.ts -> createNewBooking -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  async findBookingByIdAndUpdate(
    id: Types.ObjectId,
    updateData: Partial<IBooking>,
    loggedUser: ILoggedUser,
  ): Promise<IBooking | null> {
    try {
      const updatedReason = await this.BookingModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          changed_by: loggedUser._id,
          last_modified_on: new Date(),
        },
        {
          new: true,
          runValidators: true,
          lean: true,
        },
      );
      return updatedReason;
    } catch (err) {
      new Logger().debug(
        `booking.database.service.ts -> findBookingByIdAndUpdate -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }
}
