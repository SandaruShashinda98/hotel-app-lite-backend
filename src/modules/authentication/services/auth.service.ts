import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AUTH_CONFIG_KEYS } from '@constant/authentication/auth';
import { IAuthCredentials, ILoginPayload } from '@interface/authorization/user';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { InjectModel } from '@nestjs/mongoose';
import { IAuthCredentialsModel } from '../schemas/auth-credential.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(DB_COLLECTION_NAMES.AUTH_CREDENTIALS)
    private readonly authCredentialsModel: Model<IAuthCredentialsModel>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * The function `validateUser` validates a user's credentials by comparing the provided password with
   * the hashed password stored in the database.
   * @returns The `validateUser` function returns an object that omits the `password` field from the
   * `IAuthCredentials` interface, or it returns `null` if the user authentication fails.
   */
  async validateUser(
    user_id: string,
    password: string,
  ): Promise<Omit<IAuthCredentials, 'password'> | null> {
    const authCredentials = await this.findAuthCredential(user_id);
    if (
      authCredentials &&
      (await bcrypt.compare(password, authCredentials.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = authCredentials.toObject();
      return { ...result };
    }
    return null;
  }

  async generateTokens(user: ILoginPayload) {
    const payload = {
      username: user.username,
      sub: user._id,
      permissions: user.permissions,
      role_permission: user.role_permission
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get(AUTH_CONFIG_KEYS.JWT_SECRET),
      expiresIn: '10d',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get(AUTH_CONFIG_KEYS.JWT_SECRET),
      expiresIn: '12d',
    });

    return { access_token, refresh_token };
  }

  //TODO: @Sandaru - THINK A SUITABLE PATTERN AND ADD THIS TO THE LOGGER

  /**
   * The function `login` generates JWT tokens for a user and returns them. It should be used after
   * the user has been validated.
   * @param user - `user` is an object representing a user that has been validated. It should contain
   * properties such as `_id`, `username`, and `permissions`.
   * @returns The `login` function returns an object containing `access_token` and `refresh_token`
   * properties, which are JWT tokens that can be used for authentication.
   */
  async login(user: ILoginPayload) {
    return await this.generateTokens(user);
  }

  /**
   * The function creates an authentication credential for a user with the provided hashed password and
   * saves it to the database.
   * @param savedUser - `savedUser` is an object representing a user that has been saved in the
   * database. It likely contains properties such as `_id`, `created_by`, and other user-related
   * information.
   * @param {string} hashedPassword - The `hashedPassword` parameter in the `createAuthCredential`
   * function is a string that represents the hashed password of a user.
   */
  async createAuthCredential(savedUser, hashedPassword: string): Promise<void> {
    try {
      const authCredentials = new this.authCredentialsModel({
        user_id: savedUser._id,
        token: '',
        refresh_token: '',
        password: hashedPassword,
        created_by: savedUser.created_by,
      });
      await authCredentials.save();
    } catch (err) {
      new Logger().debug(
        `auth.service.ts -> createAuthCredential -> ${err}`,
        'DEBUG',
      );
      return null;
    }
  }

  /**
   * The function `findAuthCredential` asynchronously retrieves an authentication credential based on
   * the provided user ID.
   */
  async findAuthCredential(user_id: string) {
    return await this.authCredentialsModel.findOne({ user_id }).exec();
  }

  /**
   * The function `verifyRefreshToken` verifies a JWT refresh token and returns the payload if the
   * verification is successful. It throws an error if the verification fails.
   * @param {string} token - The `token` parameter is a string that represents a JWT (JSON Web Token)
   * that needs to be verified.
   * @returns The `verifyRefreshToken` function is returning the payload of the verified JWT token.
   */
  async verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get(AUTH_CONFIG_KEYS.JWT_SECRET),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * The `refresh` function in TypeScript asynchronously verifies a JWT token and returns a new access
   * token signed with the payload.
   * @param {string} token - The `token` parameter is a string that represents a JWT (JSON Web Token)
   * that needs to be refreshed.
   * @returns The `refresh` function is returning an object with a property `access_token` which
   * contains a new JWT token signed with the payload extracted from the input token.
   */
  async refresh(token: string) {
    try {
      const payload = await this.verifyRefreshToken(token);

      console.log('Payload:', payload);

      const user = await this.findAuthCredential(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const loginPayload = {
        _id: user.user_id,
        username: payload.username,
        permissions: payload.permissions,
        role_permission: payload.role_permission
      };

      const tokens = await this.generateTokens(loginPayload);
      return tokens;
    } catch (error) {
      throw error;
    }
  }
}
