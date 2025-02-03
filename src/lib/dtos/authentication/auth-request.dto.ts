import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class UserLoginDTO {
  @ApiProperty({
    example: 'john.doe@example.com',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((requestBody) => !requestBody.username)
  @Transform((email) => email.value?.trim())
  @Transform((email) => email.value?.toLowerCase())
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johnDoe', type: String, required: true })
  @IsString()
  @IsOptional()
  @ValidateIf((requestBody) => !requestBody.email)
  @Transform((username) => username.value?.trim())
  username: string;

  @ApiProperty({ example: 'johnDoe@123', type: String, required: true })
  @IsString()
  @IsNotEmpty()
  password: string;
}
