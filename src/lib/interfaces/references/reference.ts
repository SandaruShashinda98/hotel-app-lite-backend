import { IBaseEntity } from '@interface/common/base-entity';

export interface IBooking extends IBaseEntity {
  customer_name: string;
  mobile_number: string;
  clock_in: Date;
  clock_out: Date;
  status: string;
  note: string;
}
