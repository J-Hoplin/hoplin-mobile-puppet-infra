import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsObject } from 'class-validator';

export class VerifyDeviceDto {
  @ApiProperty({ example: 'A1B2C3', description: '6-digit auth code' })
  @IsString()
  @Length(6, 6)
  authCode: string;

  @ApiProperty({
    example: { hasShizuku: true, androidVersion: '14' },
    description: 'Device capabilities',
    required: false,
  })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown>;
}

export class VerifyDeviceResponseDto {
  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  deviceName: string;
}
