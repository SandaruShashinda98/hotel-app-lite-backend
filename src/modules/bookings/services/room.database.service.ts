import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommonDatabaseService } from '@common/services/common.database.service';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { LogsDatabaseService } from '@module/activity-logs/services/logs.database.service';
import { ILoggedUser } from '@interface/authorization/user';
import { IRoomModel } from '../schemas/room.schema';
import { IRoom } from '@interface/references/reference';

@Injectable()
export class RoomDatabaseService extends CommonDatabaseService<IRoom> {
  constructor(
    @InjectModel(DB_COLLECTION_NAMES.ROOMS)
    readonly RoomModel: Model<IRoomModel>,
    logsDatabaseService: LogsDatabaseService,
  ) {
    super(logsDatabaseService, RoomModel, DB_COLLECTION_NAMES.ROOMS);
  }

  getRoomFilters(queryParams: any): any {
    const filters: any = {};

    // Search by name, room number, or description
    if (queryParams.searchKey) {
      filters.$or = [
        { name: { $regex: queryParams.searchKey, $options: 'i' } },
        { room_number: { $regex: queryParams.searchKey, $options: 'i' } },
        { description: { $regex: queryParams.searchKey, $options: 'i' } },
      ];
    }

    // Filter by room type
    if (queryParams.roomType) {
      filters.room_type = queryParams.roomType;
    }

    // Filter by status
    if (queryParams.status) {
      filters.status = queryParams.status;
    }

    // Filter by capacity
    if (queryParams.capacity) {
      filters.capacity = { $gte: parseInt(queryParams.capacity) };
    }

    // Filter by price range
    if (queryParams.minPrice) {
      filters.price_per_night = { 
        ...filters.price_per_night,
        $gte: parseFloat(queryParams.minPrice) 
      };
    }

    if (queryParams.maxPrice) {
      filters.price_per_night = { 
        ...filters.price_per_night,
        $lte: parseFloat(queryParams.maxPrice) 
      };
    }

    // Filter by amenities (comma-separated list)
    if (queryParams.amenities) {
      const amenitiesList = queryParams.amenities.split(',');
      filters.amenities = { $all: amenitiesList };
    }

    return filters;
  }

  async createNewRoom(
    data: Partial<IRoom>,
    loggedUser: ILoggedUser,
  ): Promise<IRoom | null> {
    try {
      const newRoom = new this.RoomModel({
        ...data,
        created_by: loggedUser._id,
      });

      const savedRoom = await newRoom.save();

      return savedRoom.toObject({ versionKey: false });
    } catch (err) {
      new Logger().debug(
        `room.database.service.ts -> createNewRoom -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  async findRoomByIdAndUpdate(
    id: Types.ObjectId,
    updateData: Partial<IRoom>,
    loggedUser: ILoggedUser,
  ): Promise<IRoom | null> {
    try {
      const updatedRoom = await this.RoomModel.findByIdAndUpdate(
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
      return updatedRoom;
    } catch (err) {
      new Logger().debug(
        `room.database.service.ts -> findRoomByIdAndUpdate -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  async findRoomByRoomNumber(roomNumber: string): Promise<IRoom | null> {
    try {
      return await this.RoomModel.findOne({ room_number: roomNumber }).lean();
    } catch (err) {
      new Logger().debug(
        `room.database.service.ts -> findRoomByRoomNumber -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  async updateRoomStatus(
    id: Types.ObjectId,
    status: string,
    loggedUser: ILoggedUser,
  ): Promise<IRoom | null> {
    try {
      return await this.findRoomByIdAndUpdate(
        id,
        { status: status as any },
        loggedUser,
      );
    } catch (err) {
      new Logger().debug(
        `room.database.service.ts -> updateRoomStatus -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }
}