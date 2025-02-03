import { BaseEntitySchemaContent } from '@common/schemas/base-entity.model';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { IBooking } from '@interface/references/reference';
import { Document, model, Schema } from 'mongoose';

export type IBookingModel = IBooking & Document;

const BookingSchema = new Schema<IBookingModel>({
  ...BaseEntitySchemaContent,
  customer_name: {
    type: String,
  },
  mobile_number: {
    type: String,
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
});

const BookingModel = model<IBookingModel>(
  DB_COLLECTION_NAMES.BOOKINGS,
  BookingSchema,
);
export default BookingModel;
export { BookingSchema };
