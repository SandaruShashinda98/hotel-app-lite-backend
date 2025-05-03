import { IBaseEntity } from '@interface/common/base-entity';

export interface IBooking {
  _id?: any;
  customer_name: string;
  mobile_number: string;
  email: string;
  booking_originate: string;
  clock_in: Date;
  clock_out: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  note?: string;
  room_id: any; // Reference to the selected room
  room?: {
    _id: number;
    name: string;
    room_number: string;
    room_type: string;
    price_per_night: number;
  };
  created_at?: Date;
  updated_at?: Date;
  created_by?: any;
  changed_by?: any;
  last_modified_on?: Date;

  is_checked_in?: boolean;
  is_checked_out?: boolean;
  checked_in_at?: Date;
  checked_out_at?: Date;
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'SUITE' | 'DELUXE' | 'FAMILY';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface IRoom extends IBaseEntity {
  name: string;
  room_number: string;
  room_type: RoomType;
  capacity: number;
  price_per_night: number;
  description?: string;
  amenities?: string[];
  status: RoomStatus;
  images?: string[];
}