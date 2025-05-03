import {
  DataToCheckDto,
  FilterUserMiscDataDto,
  FilterUsersDto,
  FilterUsersMetaDataDto,
} from '@dto/authorization/user-query-param.dto';
import { CreateUserDTO } from '@dto/authorization/user-request.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilterQuery, isValidObjectId, Types } from 'mongoose';
import { UsersDatabaseService } from './user.database.service';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { ILoggedUser, IUser } from '@interface/authorization/user';
import { ACTIVE_STATE, MISC_TYPE } from '@constant/authorization/user';
import { RolesService } from '@module/roles/services/roles.service';
import { DeleteRoleDTO } from '@dto/authorization/role-request.dto';
import { IRole } from '@interface/authorization/roles';
import { DuplicateException } from '@common/filters/duplicate-exception.filter';
import { isValidPassword } from '@common/helpers/validation.helper';
import { filterByName } from '@common/helpers/filter.helper';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * The function `createOrUpdateUser` is responsible for creating or updating a user based on the
   * provided `CreateUserDTO` object and the `ILoggedUser` object.
   * @param {CreateUserDTO} createUserDto - The `CreateUserDTO` object contains the data required to
   * create or update a user.
   * @param {ILoggedUser} loggedUser - The `ILoggedUser` object contains the details of the logged-in user.
   */
  async createOrUpdateUser(
    createUserDto: CreateUserDTO,
    loggedUser: ILoggedUser,
  ) {
    // for new user
    if (!createUserDto._id || !isValidObjectId(createUserDto._id)) {
      // remove _id if it is not a valid object id
      delete createUserDto._id;

      const { password, ...userData } = createUserDto;

      // validate password according to the password policy
      if (!isValidPassword(password))
        throw new BadRequestException([RESPONSE_MESSAGES.INVALID_PASSWORD]);

      // check username availability
      const foundUsername = await this.usersDatabaseService.findDocument({
        username: userData.username.trim(),
      });
      if (foundUsername)
        throw new DuplicateException([RESPONSE_MESSAGES.USERNAME_TAKEN]);

      // check email availability
      const foundEmail = await this.usersDatabaseService.findDocument({
        email: userData.email.trim(),
      });
      if (foundEmail)
        throw new DuplicateException([RESPONSE_MESSAGES.EMAIL_TAKEN]);

      // set created by
      (userData as unknown as Partial<IUser>).created_by = loggedUser._id;

      // validate roles and set roles
      (userData as unknown as Partial<IUser>).role = [
        new Types.ObjectId('6813ad8000e07db519efa62a'),
      ];
      // (userData as unknown as Partial<IUser>).role =
      //   await this.rolesService.rolesValidationHandler(userData.role);

      // create new user
      const newUser = await this.usersDatabaseService.createUser(
        userData as unknown as Partial<IUser>,
        password,
      );

      if (!newUser)
        throw new UnprocessableEntityException([RESPONSE_MESSAGES.DB_FAILURE]);

      return newUser;
    }
    // for existing user
    else {
      //check user availability
      const foundUser = await this.usersDatabaseService.findById(
        createUserDto._id,
      );

      if (!foundUser)
        throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

      //TODO: this is for temporary(dev) purpose, remove it later
      if (foundUser.username === 'admin')
        throw new UnprocessableEntityException([
          RESPONSE_MESSAGES.FORBIDDEN_RESOURCE,
        ]);

      // update user
      const updatedUserData: IUser = {
        ...foundUser,
        ...(createUserDto as unknown as Partial<IUser>),
        changed_by: loggedUser._id,
        last_modified_on: new Date(),
      };

      const updatedUser = await this.usersDatabaseService.updateUser(
        foundUser._id.toString(),
        updatedUserData,
      );

      if (!updatedUser)
        throw new UnprocessableEntityException([RESPONSE_MESSAGES.DB_FAILURE]);

      return updatedUser;
    }
  }

  /**
   * The function `getUserFilters` takes user filter parameters and constructs a MongoDB filter criteria
   * object based on the provided values.
   * @param {FilterUsersDto} queryParams - The `getUserFilters` function takes in a `FilterUsersDto`
   * object as the `queryParams` parameter.
   */
  getUserFilters(queryParams: FilterUsersDto): FilterQuery<FilterUsersDto> {
    const { email, username, role, name, _id, virtual_extension, searchKey } =
      queryParams;

    const filterCriteria: FilterQuery<any> = {};

    if (email) {
      const regex = new RegExp(email, 'i');
      filterCriteria.email = { $regex: regex };
    }

    if (username) {
      const regex = new RegExp(username, 'i');
      filterCriteria.username = { $regex: regex };
    }

    if (role) {
      filterCriteria.role = { $in: [role] };
    }

    if (_id) {
      filterCriteria._id = new Types.ObjectId(_id);
    }

    if (virtual_extension) {
      const regex = new RegExp(virtual_extension.toString(), 'i');
      filterCriteria.virtual_extension = { $regex: regex };
    }

    if (name || searchKey) {
      //filter by first_name, last_name, full_name
      const searchTerm = name ?? searchKey;
      Object.assign(filterCriteria, filterByName(searchTerm));
    }

    filterCriteria.is_delete = false;

    return filterCriteria;
  }

  /*
   * The `getUserDataMiscFilters` function in the `UsersService` class is a method that takes user data filter
   * parameters and constructs a MongoDB filter criteria object based on the provided values.
   */
  getUserDataMiscFilters(
    queryParams: FilterUserMiscDataDto,
    userId: Types.ObjectId,
  ): FilterQuery<FilterUserMiscDataDto> {
    const { searchKey } = queryParams;

    const filterCriteria: FilterQuery<any> = {};
    filterCriteria.is_delete = false;

    if (searchKey) {
      const regex = new RegExp(searchKey, 'i');
      if (
        queryParams.type === MISC_TYPE.DESK ||
        queryParams.type === MISC_TYPE.SKILL_GROUP
      ) {
        filterCriteria.users = userId;
        filterCriteria.name = { $regex: regex };
      }

      if (queryParams.type === MISC_TYPE.ROLE) {
        filterCriteria.role = { $regex: regex };
      }
    }

    return filterCriteria;
  }

  /*
   * The `getMetaFilters` function in the `UsersService` class is a method that takes user metadata filter
   * parameters and constructs a MongoDB filter criteria object based on the provided values.
   */
  getMetaFilters(filters: FilterUsersMetaDataDto): {
    filterCriteria: FilterQuery<any>;
    deskIdsArray: Types.ObjectId[];
    skillGroupsIdsArray: Types.ObjectId[];
  } {
    const filterCriteria: FilterQuery<any> = {};
    let deskIdsArray = [];
    let skillGroupsIdsArray = [];

    filterCriteria.is_delete = false;

    if (filters.searchKey) {
      const regex = new RegExp(filters.searchKey, 'i');
      filterCriteria.$or = [
        { first_name: { $regex: regex } },
        { last_name: { $regex: regex } },
        { username: { $regex: regex } },
      ];
    }

    if (filters?.filter?.active_state) {
      const active_state = filters?.filter?.active_state;
      if (active_state === ACTIVE_STATE.ACTIVE) {
        filterCriteria.is_active = true;
      } else if (active_state === ACTIVE_STATE.DE_ACTIVE) {
        filterCriteria.is_active = false;
      } else {
        filterCriteria.is_active = { $in: [true, false] };
      }
    }

    if (
      filters?.filter?.sip_device &&
      filters?.filter?.sip_device?.length > 0
    ) {
      filterCriteria.sip_device = { $in: filters?.filter?.sip_device };
    }

    if (filters?.filter?.roleIds && filters?.filter?.roleIds?.length > 0) {
      const roleIdsArray = filters?.filter?.roleIds.map(
        (roleId) => new Types.ObjectId(roleId),
      );
      filterCriteria.role = { $in: roleIdsArray };
    }

    if (filters?.filter?.deskIds && filters?.filter?.deskIds?.length > 0)
      deskIdsArray = filters?.filter?.deskIds.map(
        (deskId) => new Types.ObjectId(deskId),
      );

    if (
      filters?.filter?.skillGroupIds &&
      filters?.filter?.skillGroupIds?.length > 0
    )
      skillGroupsIdsArray = filters?.filter?.skillGroupIds.map(
        (skillGroupId) => new Types.ObjectId(skillGroupId),
      );

    return { filterCriteria, deskIdsArray, skillGroupsIdsArray };
  }

  /**
   * This function returns the bulk operations associated with adding new roles to users
   * @param usersWithRole The `usersWithRole` parameter contains the correct users associated the role to be removed
   * which will be used to prevent unnecessary data modifications
   * @param actualUserRoles The `actualUserRoles` parameter gives the user roles which are present and not subjected to deletion in the database
   * out of the role IDs send with the deleteRoleDto
   * @param deleteRoleDto  The `deleteRoleDto` parameter contains the DTO send to delete a user role and assign new roles to the users
   */
  async updateUserRoles(
    usersWithRole: IUser[],
    actualUserRoles: Record<string, IRole | null>,
    deleteRoleDto: DeleteRoleDTO,
  ) {
    const bulkOperations = deleteRoleDto.usersAndNewRoles
      .map((userId) => {
        const user = usersWithRole.find(
          (userWithRole) => userWithRole._id.toString() == userId.user,
        );

        if (!user) return;

        const roles = userId.roles
          .map((role) => actualUserRoles[role]?._id)
          .filter((role) => role !== undefined && role !== null);

        const val = {
          updateOne: {
            filter: { _id: new Types.ObjectId(userId.user) },
            update: {
              $addToSet: { role: roles },
            },
            upsert: false,
          },
        };
        return val;
      })
      .filter((op) => op !== null && op !== undefined);

    if (bulkOperations.length)
      return await this.usersDatabaseService.bulkUpdateUserRoles(
        bulkOperations,
      );
  }

  createFindExistingUserFilter(dataToCheck: DataToCheckDto) {
    return {
      email: dataToCheck.email,
      username: dataToCheck.username,
    };
  }
}
