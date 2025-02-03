/* The AuthModule class in this TypeScript code defines the authentication module for a NestJS
application with strategies for JWT authentication. */
import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
//import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { AUTH_CONFIG_KEYS } from '@constant/authentication/auth';
import { DB_COLLECTION_NAMES } from '@constant/common/db-collection-names';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthCredentialSchema } from './schemas/auth-credential.schema';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get(AUTH_CONFIG_KEYS.JWT_SECRET),
        signOptions: {
          expiresIn: '20d',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: DB_COLLECTION_NAMES.AUTH_CREDENTIALS,
        schema: AuthCredentialSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // JwtRefreshStrategy,
    // GoogleStrategy, TODO : @Sandaru - IMPLEMENT THIS
  ],
  exports: [AuthService],
})
export class AuthModule {}
