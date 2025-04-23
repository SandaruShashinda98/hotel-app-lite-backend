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
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ObjectIDPathDTO } from '@common/dto/object-id.path.dto';
import { RESPONSE_MESSAGES } from '@constant/common/responses';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggedUser } from '@common/decorators/logged-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ILoggedUser } from '@interface/authorization/user';
import { Types } from 'mongoose';
import { RoomDatabaseService } from '../services/room.database.service';
import { PermissionGuard } from '@common/guards/permission.guard';
import { IRoom } from '@interface/references/reference';

@ApiTags('rooms')
@Controller({ path: 'rooms' })
export class RoomController {
  constructor(private readonly roomDatabaseService: RoomDatabaseService) {}

  @ApiOperation({
    summary: 'Get all rooms with filters and pagination',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.VIEW_ROOMS)
  @Get()
  async filterRooms(@Query() queryParams: any) {
    const filters = this.roomDatabaseService.getRoomFilters(queryParams);

    const foundRooms =
      await this.roomDatabaseService.filterDocumentsWithPagination(
        filters,
        Number(queryParams.start) || 0,
        Number(queryParams.size) || 0,
      );

    return foundRooms;
  }

  @ApiOperation({
    summary: 'Get single room',
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.VIEW_ROOMS)
  @Get(':id')
  async getSingleRoom(@Param() pathParams: ObjectIDPathDTO) {
    const foundRoom = await this.roomDatabaseService.findById(pathParams.id);

    if (!foundRoom)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: foundRoom };
  }

  @ApiOperation({ summary: 'Create new room' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.CREATE_ROOM)
  @Post()
  async createRoom(
    @Body() createRoom: IRoom,
    @LoggedUser() loggedUser: ILoggedUser,
  ) {
    // Check if room number already exists
    const existingRoom = await this.roomDatabaseService.findRoomByRoomNumber(
      createRoom.room_number,
    );

    if (existingRoom) {
      throw new BadRequestException('Room number already exists');
    }

    const newRoom = await this.roomDatabaseService.createNewRoom(
      createRoom,
      loggedUser,
    );

    if (!newRoom)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: newRoom };
  }

  @ApiOperation({ summary: 'Update room' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.EDIT_ROOM)
  @Patch(':id')
  async updateRoom(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: IRoom,
  ) {
    // If room_number is being updated, check if it already exists
    if (updateData.room_number) {
      const existingRoom = await this.roomDatabaseService.findRoomByRoomNumber(
        updateData.room_number,
      );

      if (existingRoom && existingRoom._id.toString() !== pathParams.id) {
        throw new BadRequestException('Room number already exists');
      }
    }

    const updatedRoom = await this.roomDatabaseService.findRoomByIdAndUpdate(
      new Types.ObjectId(pathParams.id),
      updateData,
      loggedUser,
    );

    if (!updatedRoom)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: updatedRoom };
  }

  @ApiOperation({ summary: 'Delete room' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.DELETE_ROOM)
  @Delete(':id')
  async DeleteRoom(@Param() pathParams: ObjectIDPathDTO) {
    const deletedRoom = await this.roomDatabaseService.hardDelete(
      pathParams.id,
    );

    if (!deletedRoom)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: deletedRoom };
  }

  @ApiOperation({ summary: 'Update room status' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions(PERMISSIONS.EDIT_ROOM)
  @Patch(':id/status')
  async updateRoomStatus(
    @LoggedUser() loggedUser: ILoggedUser,
    @Param() pathParams: ObjectIDPathDTO,
    @Body() updateData: { status: string },
  ) {
    const validStatuses = ['available', 'occupied', 'maintenance'];

    if (!validStatuses.includes(updateData.status)) {
      throw new BadRequestException('Invalid room status');
    }

    const updatedRoom = await this.roomDatabaseService.updateRoomStatus(
      new Types.ObjectId(pathParams.id),
      updateData.status,
      loggedUser,
    );

    if (!updatedRoom)
      throw new InternalServerErrorException([RESPONSE_MESSAGES.DB_FAILURE]);

    return { data: updatedRoom };
  }

  // @ApiOperation({ summary: 'Check room availability' })
  // @UseGuards(JwtAuthGuard)
  // @Get(':id/availability')
  // async checkRoomAvailability(
  //   @Param() pathParams: ObjectIDPathDTO,
  //   @Query('checkIn') checkIn: string,
  //   @Query('checkOut') checkOut: string,
  // ) {
  //   if (!checkIn || !checkOut) {
  //     throw new BadRequestException('Check-in and check-out dates are required');
  //   }

  //   const checkInDate = new Date(checkIn);
  //   const checkOutDate = new Date(checkOut);

  //   if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
  //     throw new BadRequestException('Invalid date format');
  //   }

  //   const isAvailable = await this.roomDatabaseService.checkRoomAvailability(
  //     new Types.ObjectId(pathParams.id),
  //     checkInDate,
  //     checkOutDate,
  //   );

  //   return { data: { available: isAvailable } };
  // }

  // @ApiOperation({ summary: 'Suggest room price' })
  // @UseGuards(JwtAuthGuard, PermissionGuard)
  // // @Permissions(PERMISSIONS.CREATE_ROOM, PERMISSIONS.EDIT_ROOM)
  // @Post('suggest-price')
  // async suggestRoomPrice(
  //   @Body() roomData: Partial<IRoom>,
  // ) {
  //   const suggestedPrice = this..suggestRoomPrice(roomData);
  //   return { data: { suggestedPrice } };
  // }
}
