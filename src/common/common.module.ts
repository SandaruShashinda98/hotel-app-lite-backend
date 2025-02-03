import { Global, Module } from "@nestjs/common";
import { ResponseService } from "./services/response.service";
import { WinstonLogger } from "./logger/winston-logger.service";

const services = [ResponseService, WinstonLogger];
@Global()
@Module({
  controllers: [],
  imports: [],
  providers: services,
  exports: services,
})
export class CommonModule {}
