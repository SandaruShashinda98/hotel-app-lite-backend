import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { CommonDatabaseService } from '@common/services/common.database.service';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { LogsDatabaseService } from '@module/activity-logs/services/logs.database.service';
import { ILoggedUser } from '@interface/authorization/user';
import { IBooking } from '@interface/references/reference';
import { IBookingModel } from '../schemas/booking.schema';
import { paginator, responseOrderMaker } from '@common/helpers/custom.helper';

@Injectable()
export class BookingDatabaseService extends CommonDatabaseService<IBooking> {
  constructor(
    @InjectModel(DB_COLLECTION_NAMES.BOOKINGS)
    readonly BookingModel: Model<IBookingModel>,
    logsDatabaseService: LogsDatabaseService,
  ) {
    super(logsDatabaseService, BookingModel, DB_COLLECTION_NAMES.BOOKINGS);
  }

  async findBookingsWithRoomDetails(
    filters: FilterQuery<IBooking>,
    skip: number = 0,
    limit: number = 10,
  ): Promise<{ data: IBooking[]; count: number }> {
    const aggregationPipeline: PipelineStage[] = [
      { $match: filters },
      {
        $lookup: {
          from: 'rooms', // Make sure this matches your collection name
          localField: 'room_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $unwind: {
          path: '$room',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          // Include all fields from the booking
          _id: 1,
          customer_name: 1,
          mobile_number: 1,
          email: 1,
          booking_originate: 1,
          clock_in: 1,
          clock_out: 1,
          status: 1,
          note: 1,
          room_id: 1,
          created_by: 1,
          changed_by: 1,
          created_on: 1,
          is_checked_in: 1,
          is_checked_out: 1,
          last_modified_on: 1,
          // Include selected fields from the room
          'room': {
            _id: '$room._id',
            name: '$room.name',
            room_number: '$room.room_number',
            room_type: '$room.room_type',
            price_per_night: '$room.price_per_night',
          }
        }
      },
      {
        $facet: {
          data: [{ $sort: { created_on: -1 } }, ...paginator(skip, limit)],
          count: [{ $count: 'total' }],
        },
      },
      {
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$count.total', 0] },
        },
      },
    ];
  
    const result = await this.BookingModel.aggregate(aggregationPipeline);
  
    return {
      data: responseOrderMaker(skip, limit, result[0].data, result[0].count),
      count: result[0].count || 0,
    };
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
      // Get the old booking to check status
      const oldBooking = await this.findById(id.toString());
      const oldStatus = oldBooking?.status;

      const updatedBooking = await this.BookingModel.findByIdAndUpdate(
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

      // Return both old and updated booking for status change detection
      return {
        ...updatedBooking,
        _oldStatus: oldStatus,
      } as any;
    } catch (err) {
      new Logger().debug(
        `booking.database.service.ts -> findBookingByIdAndUpdate -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  async findOverlappingBookings(
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<IBooking[]> {
    try {
      const filter: any = {
        // Find bookings with overlapping date ranges
        $and: [
          { clock_in: { $lt: checkOut } },
          { clock_out: { $gt: checkIn } },
          // Only consider confirmed bookings
          { status: 'confirmed' },
        ],
      };

      // Exclude the current booking if provided (useful for updates)
      if (excludeBookingId) {
        filter._id = { $ne: new Types.ObjectId(excludeBookingId) };
      }

      const overlappingBookings = await this.BookingModel.find(filter).lean();
      return overlappingBookings;
    } catch (err) {
      new Logger().debug(
        `booking.database.service.ts -> findOverlappingBookings -> ${err}`,
        'DEBUG',
      );
      return [];
    }
  }

  // async findBookingsWithRoomDetails(): Promise<IBooking[]> {
  //   try {
  //     return await this.BookingModel.find()
  //       .populate('room_id', 'name room_number room_type price_per_night')
  //       .lean();
  //   } catch (err) {
  //     new Logger().debug(
  //       `booking.database.service.ts -> findBookingsWithRoomDetails -> ${err}`,
  //       'DEBUG',
  //     );
  //     return [];
  //   }
  // }

  async findBookingsByRoomId(roomId: Types.ObjectId): Promise<IBooking[]> {
    try {
      return await this.BookingModel.find({ room_id: roomId }).lean();
    } catch (err) {
      new Logger().debug(
        `booking.database.service.ts -> findBookingsByRoomId -> ${err}`,
        'DEBUG',
      );
      return [];
    }
  }
}