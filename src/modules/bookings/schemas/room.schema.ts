import { BaseEntitySchemaContent } from '@common/schemas/base-entity.model';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { IRoom } from '@interface/references/reference';
import { Document, model, Schema } from 'mongoose';

export type IRoomModel = IRoom & Document;

const RoomSchema = new Schema<IRoomModel>({
  ...BaseEntitySchemaContent,
  name: {
    type: String,
    required: true,
  },
  room_number: {
    type: String,
    required: true,
    unique: true,
  },
  room_type: {
    type: String,
    enum: ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'FAMILY'],
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  price_per_night: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
  },
  amenities: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available',
  },
  images: {
    type: [String],
    default: [],
  },
});

const RoomModel = model<IRoomModel>(
  DB_COLLECTION_NAMES.ROOMS,
  RoomSchema,
);
export default RoomModel;
export { RoomSchema };