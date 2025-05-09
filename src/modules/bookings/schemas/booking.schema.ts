import { BaseEntitySchemaContent } from '@common/schemas/base-entity.model';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { IBooking } from '@interface/references/reference';
import { Document, model, Schema, Types } from 'mongoose';

export type IBookingModel = IBooking & Document;

const BookingSchema = new Schema<IBookingModel>({
  ...BaseEntitySchemaContent,
  customer_name: {
    type: String,
    required: true,
  },
  mobile_number: {
    type: String,
    required: true,
  },
  booking_originate: {
    type: String,
    default: 'Direct',
  },
  email: {
    type: String,
    required: true,
  },
  clock_in: {
    type: Date,
    required: true,
  },
  clock_out: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'canceled'],
    default: 'pending',
  },
  note: {
    type: String,
  },
  room_id: {
    type: Schema.Types.ObjectId,
    ref: DB_COLLECTION_NAMES.ROOMS,
    required: true,
  },
  is_checked_in: {
    type: Boolean,
    default: false,
  },
  is_checked_out: {
    type: Boolean,
    default: false,
  },
  checked_in_at: {
    type: Date,
  },
  checked_out_at: {
    type: Date,
  },
});

const BookingModel = model<IBookingModel>(
  DB_COLLECTION_NAMES.BOOKINGS,
  BookingSchema,
);
export default BookingModel;
export { BookingSchema };
