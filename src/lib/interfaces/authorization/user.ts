import { PERMISSIONS } from '@constant/authorization/roles';
import {
  SIP_SETTINGS,
  TWO_FACTOR_AUTHENTICATION_TYPE,
} from '@constant/authorization/user';
import { IBaseEntity } from '@interface/common/base-entity';
import { Types } from 'mongoose';

export interface IUser extends IBaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: Types.ObjectId[];
  role_permission: string[];
  add_to_currant_and_future_desks?: boolean;
  add_to_currant_and_future_skill_groups?: boolean;
  is_assign_leads?: boolean;
  virtual_extension?: number;
  sip_setting?: SIP_SETTINGS;
  two_factor_authentication_type?: TWO_FACTOR_AUTHENTICATION_TYPE;
  max_concurrent_sessions?: number;
  devices?: string[];
  last_login?: Date;
}

export type ILoggedUser = IUser & Pick<ILoginPayload, 'permissions'>;

export interface IAuthCredentials extends IBaseEntity {
  user_id: Types.ObjectId; // object id of the user
  token: string;
  refresh_token: string;
  password: string;
}

export interface ILoginPayload {
  _id: Types.ObjectId | string;
  username: string;
  permissions: PERMISSIONS[];
}
