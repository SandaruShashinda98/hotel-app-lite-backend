import { BaseEntitySchemaContent } from '@common/schemas/base-entity.model';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { PERMISSIONS } from '@constant/authorization/roles';
import { IRole } from '@interface/authorization/roles';
import { Document, model, Schema } from 'mongoose';

export type IRoleModel = IRole & Document;

const RoleSchema = new Schema<IRoleModel>({
  ...BaseEntitySchemaContent,
  role: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  permissions: {
    type: [String],
    enum: PERMISSIONS,
    required: true,
  },
  is_clone: {
    type: Boolean,
    default: false,
    required: true,
  },
  is_phone_masked: {
    type: Boolean,
    default: false,
    required: true,
  },
  accepted_ips: {
    type: [String],
    required: false,
  },
  level: {
    type: Number,
    default: 0,
    required: true,
  },
});

const RoleModel = model<IRoleModel>(DB_COLLECTION_NAMES.ROLES, RoleSchema);
export default RoleModel;
export { RoleSchema };
