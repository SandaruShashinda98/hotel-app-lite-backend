import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  Controller,
  UseGuards,
  Post,
  Get,
  Req,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ILoginPayload, IUser } from '@interface/authorization/user';
import { UsersDatabaseService } from '@module/users/services/user.database.service';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { UserLoginDTO } from '@dto/authentication/auth-request.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserLoginResponseDTO } from '@dto/authentication/auth-response.dto';
import { RolesDatabaseService } from '@module/roles/services/roles.database.service';
import { PERMISSIONS } from '@constant/authorization/roles';
import { LogRequest } from '@common/decorators/log-request-response.decorator';
import { RefreshTokenRequestDto } from '@dto/refresh-token/refresh-token-request.dto';
import { RefreshTokenResponseDto } from '@dto/refresh-token/refresh-token-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly rolesDatabaseService: RolesDatabaseService,
  ) {}

  @ApiOperation({ summary: 'Login in to the system' })
  @ApiResponse({ type: UserLoginResponseDTO })
  @LogRequest('auth -> userLogin')
  @Post('login')
  async userLogin(@Body() body: UserLoginDTO) {
    let foundUser: IUser;

    if ((!body.email || !body.username) && !body.password)
      throw new BadRequestException();

    // login by username
    if (body.username && !body.email) {
      foundUser = await this.usersDatabaseService.findDocument({
        username: body.username,
      });
    }

    // login by email or have both
    if ((body.email && !body.username) || (body.email && body.username)) {
      foundUser = await this.usersDatabaseService.findDocument({
        email: body.email,
      });
    }

    if (!foundUser)
      throw new NotFoundException([RESPONSE_MESSAGES.INVALID_CREDENTIALS]);

    const foundAuthCredentials = await this.authService.validateUser(
      foundUser._id.toString(),
      body.password,
    );

    if (!foundAuthCredentials)
      throw new NotFoundException([RESPONSE_MESSAGES.INVALID_CREDENTIALS]);

    // find permission list
    const uniquePermissions: PERMISSIONS[] =
      await this.rolesDatabaseService.getUniquePermissionList(foundUser.role);

    const payload: ILoginPayload = {
      _id: foundUser._id,
      username: foundUser.username,
      permissions: uniquePermissions,
      role_permission: foundUser.role_permission,
    };

    const tokens = await this.authService.login(payload);

    if (tokens) {
      //update last login
      await this.usersDatabaseService.updateUser(foundUser._id.toString(), {
        last_login: new Date(),
      });
    }

    return {
      data: {
        ...tokens,
        ...foundUser,
        access_token_expires_in: 864000, //expires in 10 days
      },
    };
  }

  @LogRequest('auth -> refresh')
  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    const { refresh_token } = body;

    if (!refresh_token) throw new BadRequestException();

    const token = await this.authService.refresh(refresh_token);

    return {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      access_token_expires_in: 864000, //expires in 10 days
    };
  }

  //TODO
  @UseGuards(JwtAuthGuard)
  @LogRequest('auth -> getProfile')
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
