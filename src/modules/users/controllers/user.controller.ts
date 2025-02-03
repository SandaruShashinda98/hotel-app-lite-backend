import {
  Controller,
  Body,
  UseGuards,
  UnprocessableEntityException,
  Get,
  Query,
  Param,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UsersDatabaseService } from '../services/user.database.service';
import {
  CreateUserDTO,
  UpdateUserDTO,
} from '@dto/authorization/user-request.dto';
import {
  CreateUserResponseDTO,
  FilterUserResponseDTO,
  FindUserResponseDTO,
} from '@dto/authorization/user-response.dto';
import { FilterUsersDto } from '@dto/authorization/user-query-param.dto';
import { UsersService } from '../services/user.service';
import { ObjectIDPathDTO } from '@common/dto/object-id.path.dto';
import { ILoggedUser, IUser } from '@interface/authorization/user';
import { LoggedUser } from '@common/decorators/logged-user.decorator';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@constant/authorization/roles';
import { LogRequest } from '@common/decorators/log-request-response.decorator';

@ApiTags('users')
@Controller({ path: 'users' })
export class UserController {
  constructor(
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiResponse({ type: FilterUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Get()
  async filterUsers(@Query() queryParams: FilterUsersDto) {
    const filters = this.usersService.getUserFilters(queryParams);

    const foundUsers =
      await this.usersDatabaseService.filterDocumentsWithPagination(
        filters,
        queryParams.start || 0,
        queryParams.size || 0,
      );

    return foundUsers;
  }

  @ApiOperation({ summary: 'Get all users for search' })
  @ApiResponse({ type: FilterUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Get('search')
  async getUsersForSearch(@Query() queryParams: FilterUsersDto) {
    const filters = this.usersService.getUserFilters(queryParams);

    const foundUsers = await this.usersDatabaseService.filterSearchData(
      filters,
      queryParams.start || 0,
      queryParams.size || 0,
      '$username',
    );
    return foundUsers;
  }

  @ApiOperation({ summary: 'Get user by object id' })
  @ApiResponse({ type: FindUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Get(':id')
  async getUserByID(@Param() pathParams: ObjectIDPathDTO) {
    const foundUser = await this.usersDatabaseService.findById(pathParams.id);

    if (!foundUser)
      throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

    return { data: foundUser };
  }

  @ApiOperation({ summary: 'Get user by object id' })
  @ApiResponse({ type: FindUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @Get('name/:id')
  async getUserFullNameByID(@Param() pathParams: ObjectIDPathDTO) {
    const foundUser = await this.usersDatabaseService.findById(pathParams.id);

    if (!foundUser)
      throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

    return {
      data: {
        first_name: foundUser.first_name?.trim() ?? '',
        last_name: foundUser.last_name?.trim() ?? '',
      },
    };
  }

  @ApiOperation({
    summary: 'Create new user with auth credentials / update user',
  })
  @ApiResponse({ type: CreateUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @LogRequest('users -> createUser')
  @Patch()
  async createUser(
    @Body() createUserDto: CreateUserDTO,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    createUserDto.password = 'Password@123';

    const userData = await this.usersService.createOrUpdateUser(
      createUserDto,
      loggedUser,
    );

    if (!userData)
      throw new UnprocessableEntityException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: userData };
  }

  @ApiOperation({ summary: 'Update new user' })
  @ApiResponse({ type: CreateUserResponseDTO })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSIONS.ADMIN)
  @LogRequest('users -> updateUser')
  @Patch(':id')
  async updateUser(
    @Body() updateUserDto: UpdateUserDTO,
    @Param() pathParams: ObjectIDPathDTO,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    const foundUser = await this.usersDatabaseService.findById(pathParams.id);

    if (!foundUser)
      throw new NotFoundException([RESPONSE_MESSAGES.DATA_NOT_FOUND]);

    if (foundUser.username === 'admin')
      throw new UnprocessableEntityException([
        RESPONSE_MESSAGES.FORBIDDEN_RESOURCE,
      ]);

    (updateUserDto as unknown as Partial<IUser>).changed_by = loggedUser._id;

    const updatedUser = await this.usersDatabaseService.updateUser(
      foundUser._id.toString(),
      updateUserDto as unknown as Partial<IUser>,
    );

    if (!updatedUser)
      throw new UnprocessableEntityException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: updatedUser };
  }
}
