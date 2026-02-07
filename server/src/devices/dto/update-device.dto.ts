import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'My Galaxy S24', description: 'New device name' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Folder ID to move device to (null to uncategorize)' })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}

export class MoveDeviceToFolderDto {
  @ApiPropertyOptional({ description: 'Folder ID to move device to (null to uncategorize)' })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
