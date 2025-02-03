import { PERMISSIONS } from '@constant/authorization/roles';
import { IBaseEntity } from '@interface/common/base-entity';

export interface IRole extends IBaseEntity {
  role: string;
  description?: string;
  level: number;
  permissions: PERMISSIONS[];
  is_clone: boolean;
  is_phone_masked: boolean;
  accepted_ips?: string[];
}
