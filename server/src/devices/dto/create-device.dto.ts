import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Galaxy S24', description: 'Device name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
