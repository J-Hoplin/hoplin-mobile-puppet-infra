import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';

export class FolderDeviceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: DeviceStatus })
  status: DeviceStatus;

  @ApiPropertyOptional()
  lastSeenAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class FolderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FolderWithStatsDto extends FolderResponseDto {
  @ApiProperty()
  deviceCount: number;

  @ApiProperty()
  onlineCount: number;

  @ApiProperty()
  offlineCount: number;
}

export class FolderWithDevicesDto extends FolderResponseDto {
  @ApiProperty({ type: [FolderDeviceDto] })
  devices: FolderDeviceDto[];
}
