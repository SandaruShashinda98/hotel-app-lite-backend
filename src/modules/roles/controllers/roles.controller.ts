import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ObjectIDPathDTO } from '@common/dto/object-id.path.dto';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggedUser } from '@common/decorators/logged-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ILoggedUser, IUser } from '@interface/authorization/user';
import { Types } from 'mongoose';
import { RolesDatabaseService } from '../services/roles.database.service';
import { IRole } from '@interface/authorization/roles';
import { GetRoleQueryDTO } from '@dto/authorization/role-query-params.dto';
import {
  CreateRoleResponseDTO,
  FilterRolesResponseDTO,
} from '@dto/authorization/role-response.dto';
import {
  CreateRoleDTO,
  UpdateRoleDTO,
  DeleteRoleDTO,
} from '@dto/authorization/role-request.dto';
import { RolesService } from '../services/roles.service';
import { PermissionGuard } from '@common/guards/permission.guard';
import {
  PERMISSIONS,
  PERMISSIONS_DESCRIPTION,
} from '@constant/authorization/roles';
import { Permissions } from '@common/decorators/permissions.decorator';
import { CommonSearchResponseDTO } from '@common/dto/common-fields.dto';
import { UsersDatabaseService } from '@module/users/services/user.database.service';
import { UsersService } from '@module/users/services/user.service';
import { LogRequest } from '@common/decorators/log-request-response.decorator';
import { DuplicateException } from '@common/filters/duplicate-exception.filter';

@ApiTags('roles')
@Controller({ path: 'roles' })
export class RolesController {
  constructor(
    private readonly rolesDatabaseService: RolesDatabaseService,
    private readonly rolesService: RolesService,
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Get all user roles and pagination',
  })
  @ApiResponse({ type: FilterRolesResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.SHOW_ROLE)
  @Get()
  async filterRoles(@Query() queryParams: GetRoleQueryDTO) {
    const filters = this.rolesService.getRolesFilters(queryParams);

    const foundRoles =
      await this.rolesDatabaseService.filterDocumentsWithPagination(
        filters,
        queryParams.start || 0,
        queryParams.size || 0,
      );

    return foundRoles;
  }

  @ApiOperation({
    summary: 'Get all user roles and pagination - for search',
  })
  @ApiResponse({ type: CommonSearchResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.SHOW_ROLE)
  @Get('search')
  async filterSearchRoles(@Query() queryParams: GetRoleQueryDTO) {
    const filters = this.rolesService.getRolesFilters(queryParams);

    const foundRoles = await this.rolesDatabaseService.filterSearchData(
      filters,
      queryParams.start || 0,
      queryParams.size || 0,
      '$role',
    );

    return foundRoles;
  }

  @ApiOperation({
    summary: 'Get all user roles for delete',
  })
  @ApiResponse({ type: CommonSearchResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.SHOW_ROLE)
  @Get('list')
  async listRolesForDelete(@Query() queryParams: GetRoleQueryDTO) {
    if (!queryParams._id) return { data: [] };

    return await this.rolesDatabaseService.listAllRoles(queryParams._id);
  }

  @ApiOperation({
    summary: 'Get permissions list',
  })
  @ApiResponse({ type: CreateRoleResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.SHOW_ROLE)
  @Get('permissions')
  async getPermissionList(@Query() queryParams: GetRoleQueryDTO) {
    // Convert PERMISSIONS_DESCRIPTION to an array of id-name pairs
    let permissions = Object.entries(PERMISSIONS_DESCRIPTION).map(
      ([id, name]) => ({
        id,
        name,
      }),
    );

    // Apply filtering if searchKey is provided
    if (queryParams.searchKey) {
      const lowerCaseFilterKey = queryParams.searchKey.toLowerCase();
      permissions = permissions.filter(
        ({ id, name }) =>
          id.toLowerCase().includes(lowerCaseFilterKey) ||
          name.toLowerCase().includes(lowerCaseFilterKey),
      );
    }

    return { data: permissions };
  }

  @ApiOperation({
    summary: 'Get single role by id',
  })
  @ApiResponse({ type: CreateRoleResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.SHOW_ROLE)
  @Get(':id')
  async getSingleRoles(@Param() pathParams: ObjectIDPathDTO) {
    const foundRole = await this.rolesDatabaseService.findById(pathParams.id);

    if (!foundRole)
      throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

    return { data: foundRole };
  }

  @ApiOperation({ summary: 'Get roles for a given role id array' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Post('roles')
  async getRolesByIds(@Body() body: { roleIds: string[] }) {
    const foundRoles =
      await this.rolesDatabaseService.getRoleIdsAndReturnsNames(body.roleIds);

    return { data: foundRoles };
  }

  @ApiOperation({ summary: 'Create new user role' })
  @ApiResponse({ type: CreateRoleResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN, PERMISSIONS.CREATE_ROLE)
  @LogRequest('roles -> createRole')
  @Post()
  async createRole(
    @Body() createRoleDto: CreateRoleDTO,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    const foundDuplicates = await this.rolesDatabaseService.findDocument({
      role: createRoleDto.role.trim(),
      is_delete: false,
    });

    if (foundDuplicates)
      throw new DuplicateException([RESPONSE_MESSAGES.DUPLICATE_ROLE]);

    //remove empty ip strings
    if (createRoleDto.accepted_ips?.length > 0)
      createRoleDto.accepted_ips = createRoleDto.accepted_ips.filter(
        (ip) => ip && ip?.trim() !== '',
      );

    const roleData: Partial<IRole> = {
      ...createRoleDto,
      is_phone_masked: createRoleDto.is_phone_masked ?? false,
      is_clone: createRoleDto.is_clone ?? false,
    };

    const newRole = await this.rolesDatabaseService.createNewRole(
      roleData,
      loggedUser,
    );

    if (!newRole) {
      throw new InternalServerErrorException([
        createRoleDto.is_clone
          ? RESPONSE_MESSAGES.DB_FAILURE
          : RESPONSE_MESSAGES.ROLE_CREATE_ERR,
      ]);
    }

    return { data: newRole };
  }

  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ type: CreateRoleResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(
    PERMISSIONS.ADMIN,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_ROLE,
  )
  @LogRequest('roles -> updateRole')
  @Patch(':id')
  async updateRole(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateRoleDto: UpdateRoleDTO,
  ) {
    // check user permissions to validate delete action
    this.rolesService.updateRolePermissionHandler(updateRoleDto, loggedUser);

    const foundDuplicates = await this.rolesDatabaseService.findDocument({
      role: updateRoleDto.role.trim(),
      _id: { $ne: new Types.ObjectId(pathParams.id) },
      is_delete: false,
    });

    if (foundDuplicates)
      throw new DuplicateException([RESPONSE_MESSAGES.DUPLICATE_ROLE]);

    const foundRole = await this.rolesDatabaseService.findById(pathParams.id);

    //remove empty ip strings
    if (updateRoleDto.accepted_ips?.length > 0) {
      updateRoleDto.accepted_ips = updateRoleDto.accepted_ips.filter(
        (ip) => ip && ip.trim() !== '',
      );
    }

    const updateData: IRole = {
      ...foundRole,
      ...updateRoleDto,
      permissions:
        updateRoleDto.permissions && updateRoleDto.permissions?.length > 0
          ? updateRoleDto.permissions
          : foundRole.permissions,
      accepted_ips:
        updateRoleDto.accepted_ips && updateRoleDto.accepted_ips?.length > 0
          ? updateRoleDto.accepted_ips
          : foundRole.accepted_ips,
    };

    const updatedRole = await this.rolesDatabaseService.findRoleByIdAndUpdate(
      new Types.ObjectId(pathParams.id),
      updateData,
      loggedUser,
    );

    if (!updatedRole)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: updatedRole };
  }

  @ApiOperation({ summary: 'Update User Roles and Delete Existing Role' })
  @ApiResponse({ type: CreateRoleResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(
    PERMISSIONS.ADMIN,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_ROLE,
  )
  @LogRequest('roles -> deleteRole')
  @Patch('delete/:id')
  async deleteRole(
    @LoggedUser() LoggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() deleteRoleDto: DeleteRoleDTO,
  ) {
    //check user permissions to validate delete action
    this.rolesService.deleteRolePermissionHandler(LoggedUser);
    //check the existence of the user role
    const foundRole = await this.rolesDatabaseService.findById(pathParams.id);

    if (!foundRole)
      throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

    //get the users with the roles
    const usersWithRole: IUser[] =
      await this.usersDatabaseService.findUsersWithRole(foundRole._id);

    // //If there are no users delete User Role and Return
    if (deleteRoleDto?.usersAndNewRoles?.length) {
      // //get all the user roles exists within the database
      const actualUserRoles: Record<string, IRole | null> =
        await this.rolesService.checkUserRoleExistence(deleteRoleDto);

      //bulk update users
      await this.usersService.updateUserRoles(
        usersWithRole,
        actualUserRoles,
        deleteRoleDto,
      );
    }

    //delete user role
    await this.usersDatabaseService.deleteRoleFromUsers(
      usersWithRole,
      foundRole,
    );

    //delete role (change database status)
    return await this.rolesDatabaseService.deleteRole(foundRole);
  }
}
