import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Galaxy S24', description: 'Device name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Folder ID to assign device to' })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
