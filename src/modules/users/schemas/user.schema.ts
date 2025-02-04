import { BaseEntitySchemaContent } from '@common/schemas/base-entity.model';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import {
  SIP_SETTINGS,
  TWO_FACTOR_AUTHENTICATION_TYPE,
} from '@constant/authorization/user';
import { IUser } from '@interface/authorization/user';
import { Document, model, Schema } from 'mongoose';

export type IUserModel = IUser & Document;

const UserSchema = new Schema<IUserModel>({
  ...BaseEntitySchemaContent,
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: [{ type: Schema.Types.ObjectId, ref: DB_COLLECTION_NAMES.ROLES }],
  role_permission: [{ type: String }],
  add_to_currant_and_future_desks: {
    type: Boolean,
    default: false,
  },
  add_to_currant_and_future_skill_groups: {
    type: Boolean,
    default: false,
  },
  is_assign_leads: {
    type: Boolean,
    default: false,
  },
  virtual_extension: {
    type: Number,
    default: 0,
  },
  sip_setting: {
    type: String,
    enum: SIP_SETTINGS,
  },
  two_factor_authentication_type: {
    type: String,
    enum: TWO_FACTOR_AUTHENTICATION_TYPE,
    default: TWO_FACTOR_AUTHENTICATION_TYPE.DISABLED,
  },
  max_concurrent_sessions: {
    type: Number,
  },
  last_login: {
    type: Date,
  },
  devices: {
    type: [String],
  },
});

const UserModel = model<IUserModel>(DB_COLLECTION_NAMES.USERS, UserSchema);
export default UserModel;
export { UserSchema };
