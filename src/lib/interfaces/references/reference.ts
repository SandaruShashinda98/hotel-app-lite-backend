import { IBaseEntity } from '@interface/common/base-entity';

export interface IBooking extends IBaseEntity {
  customer_name: string;
  mobile_number: string;
  clock_in: Date;
  clock_out: Date;
  status: string;
  note: string;
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