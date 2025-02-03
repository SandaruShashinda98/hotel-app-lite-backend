/**
 * The `bootstrap` function sets up a NestJS application with global prefixes, Swagger documentation,
 * validation pipes, and listens on a specified port.
 */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SYSTEM_CONFIG_KEYS } from '@constant/common/system-config-keys';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from '@common/logger/winston-logger.service';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ValidationExceptionFilter } from '@common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger(),
  });

  // winston logger
  const logger = app.get(WinstonLogger);
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new LoggingInterceptor(logger, reflector));

  // overriding bad request exceptions
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ValidationExceptionFilter());

  const configService = app.get<ConfigService>(ConfigService);
  app.use(helmet());

  // global prefixes
  app.setGlobalPrefix('api');

  // Enable validation globally (DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:4200'],
  });

  const port = configService.get(SYSTEM_CONFIG_KEYS.PORT);

  await app.listen(port);

  new Logger().log(`Backend is listening on port ${port}`, 'NestApplication');
}
bootstrap();
