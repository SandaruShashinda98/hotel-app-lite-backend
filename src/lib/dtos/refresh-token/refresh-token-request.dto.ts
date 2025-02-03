import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsNotEmpty({ message: 'Refresh token is required' })
  refresh_token: string;
}
