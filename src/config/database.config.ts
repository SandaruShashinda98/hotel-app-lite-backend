import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

export const DatabaseConfig = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const databaseURI = configService.get('DB_URI');

    const uri = databaseURI;

    return {
      uri,
    };
  },
  inject: [ConfigService],
});
