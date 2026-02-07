import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';

export class FolderInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class DeviceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: DeviceStatus })
  status: DeviceStatus;

  @ApiPropertyOptional()
  folderId?: string | null;

  @ApiPropertyOptional({ type: FolderInfoDto })
  folder?: FolderInfoDto | null;

  @ApiPropertyOptional()
  capabilities?: Record<string, unknown>;

  @ApiPropertyOptional()
  lastSeenAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class DeviceWithAuthCodeDto extends DeviceResponseDto {
  @ApiProperty({ description: '6-digit auth code for device registration' })
  authCode: string;
}
