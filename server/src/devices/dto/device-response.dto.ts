import { ApiProperty } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';

export class DeviceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: DeviceStatus })
  status: DeviceStatus;

  @ApiProperty({ required: false })
  capabilities?: Record<string, unknown>;

  @ApiProperty({ required: false })
  lastSeenAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class DeviceWithAuthCodeDto extends DeviceResponseDto {
  @ApiProperty({ description: '6-digit auth code for device registration' })
  authCode: string;
}
