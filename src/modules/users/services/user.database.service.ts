import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IUserModel } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CommonDatabaseService } from '@common/services/common.database.service';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { LogsDatabaseService } from '@module/activity-logs/services/logs.database.service';
import { AuthService } from '@module/authentication/services/auth.service';
import { RolesDatabaseService } from '@module/roles/services/roles.database.service';
import { PERMISSIONS } from '@constant/authorization/roles';
import { SYSTEM_CHANGES } from '@constant/common/system-changes';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { IRole } from '@interface/authorization/roles';
import { IUser } from '@interface/authorization/user';

@Injectable()
export class UsersDatabaseService extends CommonDatabaseService<IUser> {
  constructor(
    private readonly rolesDatabaseService: RolesDatabaseService,
    @InjectModel(DB_COLLECTION_NAMES.USERS)
    private readonly userModel: Model<IUserModel>,
    logsDatabaseService: LogsDatabaseService,
    private readonly authService: AuthService,
  ) {
    super(logsDatabaseService, userModel, DB_COLLECTION_NAMES.USERS);
  }

  async onModuleInit() {
    // find or create default role
    let role = await this.rolesDatabaseService.findDocument({
      role: 'Admin',
    });

    if (!role) {
      role = await this.rolesDatabaseService.createNewRole({
        role: 'Admin',
        permissions: [PERMISSIONS.ADMIN],
      });
      new Logger().log('Admin role created', 'NestApplication');
    } else {
      new Logger().log('Admin role available', 'NestApplication');
    }

    // find or create default admin user
    const adminUser = await this.findDocument({ username: 'admin' });

    if (!adminUser) {
      await this.createUser(
        {
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          username: 'admin',
          role: [role._id],
          created_by: SYSTEM_CHANGES.SYSTEM,
          role_permission: 'ADMIN',
        },
        'admin123', //password
      );
      new Logger().log('Admin user created', 'NestApplication');
    } else {
      new Logger().log('Admin user available', 'NestApplication');
    }
  }

  /**
   * The function `createUser` creates a new user, saves the user data, hashes the password, and
   * creates an authentication credential.
   * @param userData - Partial<IUser> - This parameter represents the user data that is used to create
   * a new user. It is of type Partial<IUser>, which means it contains a subset of properties from the IUser interface.
   * @param {string} password - This password will be hashed using bcrypt before being stored securely in the database.
   */
  async createUser(
    userData: Partial<IUser>,
    password: string,
  ): Promise<IUserModel> {
    try {
      const user = new this.userModel(userData);
      const savedUser = await user.save();
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.authService.createAuthCredential(savedUser, hashedPassword);

      return savedUser;
    } catch (err) {
      new Logger().debug(
        `user.database.service.ts -> createUser -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  /**
   * This function updates a user in a database using the provided user ID and update data.
   * @param {string} userId - The `userId` parameter is a string that represents the unique identifier of
   * the user whose information is being updated.
   * @param updateUserDto - The `updateUserDto` parameter is of type `Partial<IUser>`, which means it is
   * an object that can contain a subset of properties of the `IUser` interface.
   */
  async updateUser(
    userId: string,
    updateUserDto: Partial<IUser>,
  ): Promise<IUser> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: updateUserDto },
          { new: true, runValidators: true },
        )
        .exec();

      return updatedUser;
    } catch (err) {
      new Logger().debug(
        `user.database.service.ts -> updateUser -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  /**
   * This function fetches the Users with the given Role
   * @param id The `id` parameter identified as a ObjectId of the Role Document
   * @returns The function returns the Users which were assigned the role corresponding to the function parameter
   */
  async findUsersWithRole(id: Types.ObjectId): Promise<IUser[]> {
    return await this.userModel.find({ role: id });
  }

  /**This function performs a bulk write operation to the user documents
   *@param bulkOperations The `bulkOperations` parameter includes the operation which will update the users to new roles
   *@returns This function returns the result of the operation
   */
  async bulkUpdateUserRoles(bulkOperations: any) {
    try {
      return await this.userModel.bulkWrite(bulkOperations);
    } catch {
      throw new Error(RESPONSE_MESSAGES.DB_FAILURE);
    }
  }

  /**
   * The function removes the given role from the given users
   * @param usersWithRole The `usersWithRole` parameter includes the information of users and new roles to be assigned to the users
   * @param foundRole The `foundRole` parameter includes the IRole Object of the role that needs to be removed from the users
   * @returns This function returns the result of the operation of removing roles from users
   */
  async deleteRoleFromUsers(usersWithRole: IUser[], foundRole: IRole) {
    const userIds = usersWithRole.map((user) => user._id);
    try {
      return await this.userModel.updateMany(
        {
          _id: { $in: userIds },
        },
        { $pull: { role: foundRole._id } },
      );
    } catch {
      throw new Error(RESPONSE_MESSAGES.DB_FAILURE);
    }
  }
}
