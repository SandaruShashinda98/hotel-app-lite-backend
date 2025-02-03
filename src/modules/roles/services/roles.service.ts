import { ForbiddenException, Injectable } from '@nestjs/common';
import { FilterQuery, isValidObjectId, Types } from 'mongoose';
import { GetRoleQueryDTO } from '@dto/authorization/role-query-params.dto';
import {
  DeleteRoleDTO,
  UpdateRoleDTO,
  UserChangeRoleDTO,
} from '@dto/authorization/role-request.dto';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { PERMISSIONS } from '@constant/authorization/roles';
import { ILoggedUser } from '@interface/authorization/user';
import { RolesDatabaseService } from './roles.database.service';
import { IRole } from '@interface/authorization/roles';

@Injectable()
export class RolesService {
  constructor(private rolesDatabaseService: RolesDatabaseService) {}

  getRolesFilters(queryParams: GetRoleQueryDTO) {
    const { searchKey, _id } = queryParams;

    const filterCriteria: FilterQuery<GetRoleQueryDTO> = {};

    filterCriteria.is_delete = false;

    if (searchKey) {
      filterCriteria.role = { $regex: searchKey, $options: 'i' };
    }

    if (_id) {
      filterCriteria._id = _id;
    }

    return filterCriteria;
  }

  updateRolePermissionHandler(
    updateRoleDto: UpdateRoleDTO,
    loggedUser: ILoggedUser,
  ) {
    if (updateRoleDto.is_delete) {
      if (
        !(
          loggedUser.permissions.includes(PERMISSIONS.DELETE_ROLE) ||
          loggedUser.permissions.includes(PERMISSIONS.ADMIN)
        )
      )
        throw new ForbiddenException([RESPONSE_MESSAGES.FORBIDDEN_RESOURCE]);
    }
  }

  async rolesValidationHandler(roles: string[]): Promise<Types.ObjectId[]> {
    if (roles.length === 0) return [];

    const roleQueries = roles.map((role) =>
      isValidObjectId(role)
        ? this.rolesDatabaseService.findById(role)
        : this.rolesDatabaseService.findDocument({ role: role }),
    );

    const foundRoles = await Promise.all(roleQueries);

    return foundRoles
      .filter((role): role is NonNullable<typeof role> => role !== null)
      .map((role) => role._id);
  }

  /**
   * This function checks whether the users have access to delete a user role
   * @param loggedUser // The loggedUser parameter is used to specify the logged Users who will be making changes
   */
  async deleteRolePermissionHandler(loggedUser: ILoggedUser) {
    if (
      !loggedUser.permissions.includes(PERMISSIONS.DELETE_ROLE) &&
      !loggedUser.permissions.includes(PERMISSIONS.ADMIN)
    )
      throw new ForbiddenException([RESPONSE_MESSAGES.FORBIDDEN_RESOURCE]);
  }

  /**
   * This function extracts the Unique role IDs from the roles assigned to users
   * @param usersAndNewRoles The `usersAndNewRoles` parameter contains the information of users that needs user role change as well their
   * corresponding new roles
   * @returns The function returns an array of unique Role IDs
   */
  private extractUniqueRoleIDS(usersAndNewRoles: UserChangeRoleDTO[]) {
    const set = new Set<string>();

    usersAndNewRoles.forEach((userAndNewRoles) => {
      userAndNewRoles.roles.forEach((role) => {
        if (!set.has(role)) set.add(role);
      });
    });

    return Array.from(set);
  }

  /**
   * This function identified the roles which were assigned to users and sends an object containing the roles
   * @param deleteRoleDto The `deleteRoleDto` is a parameter is the DTO which contains the information of users that needs user role change as well their
   * corresponding new roles
   * @returns The function returns an object of roles which actually exists within the database
   * as well as the IRole value associated with the sent role ID, the value will be null if
   * there is no such role in existence within the database
   */
  async checkUserRoleExistence(deleteRoleDto: DeleteRoleDTO) {
    const usersAndNewRoles = deleteRoleDto.usersAndNewRoles;

    //extract the unique role IDs
    const uniqueRoleIDS = this.extractUniqueRoleIDS(usersAndNewRoles);

    //check the IDS exists within the database
    const existingRoles: IRole[] =
      await this.rolesDatabaseService.filterDocuments({
        _id: {
          $in: uniqueRoleIDS,
        },
        is_delete: { $ne: true },
      });

    const actualRoles: Record<string, IRole | null> = {};

    //add the Roles to the actualRoles Object
    uniqueRoleIDS.forEach((uniqueRoleID) => {
      actualRoles[uniqueRoleID] =
        existingRoles.find((role) => role._id.toString() === uniqueRoleID) ??
        null;
    });

    return actualRoles;
  }
}
