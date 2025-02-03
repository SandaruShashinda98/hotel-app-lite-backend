/* The AppModule class in this TypeScript code is responsible for initializing modules and handling any
misconfigured modules by restarting the application. */
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ThrottlerConfigService } from '@common/services/throttler-config.service';
import { AuthModule } from '@module/authentication/auth.module';
import { ActivityLogsModule } from '@module/activity-logs/activity-logs.module';
import { AppInitService } from '@common/services/app-init.service';
import { AppConfigModule } from '@config/config.module';
import { AppMiddlewareModule } from './app-middleware.module';
import { UsersModule } from '@module/users/users.module';
import { CommonModule } from '@common/common.module';
import { RoleModule } from '@module/roles/roles.module';
import { BookingModule } from '@module/bookings/booking.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useClass: ThrottlerConfigService,
    }),

    //---- don't change these global module's order ----
    CommonModule,
    RoleModule,
    UsersModule,
    AuthModule,
    ActivityLogsModule,
    //--------------------------------------------------

    BookingModule,
  ],
  providers: [AppInitService],
})
export class AppModule extends AppMiddlewareModule implements OnModuleInit {
  constructor(private readonly appInitService: AppInitService) {
    super();
  }

  onModuleInit() {
    if (this.appInitService.failedModules.length > 0) {
      new Logger().error(
        'Restarting the app due to misconfigured module(s)',
        'NestApplication',
      );
      this.appInitService.clearFailedModules();
      this.appInitService.restartTheApp();
    }
  }
}
