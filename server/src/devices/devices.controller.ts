import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import {
  CreateDeviceDto,
  VerifyDeviceDto,
  VerifyDeviceResponseDto,
  DeviceResponseDto,
  DeviceWithAuthCodeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new device and generate auth code' })
  @ApiResponse({ status: 201, type: DeviceWithAuthCodeDto })
  async createDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDeviceDto,
  ): Promise<DeviceWithAuthCodeDto> {
    const device = await this.devicesService.createDevice(userId, dto);
    return {
      id: device.id,
      name: device.name,
      authCode: device.authCode,
      status: device.status,
      createdAt: device.createdAt,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all devices for current user' })
  @ApiResponse({ status: 200, type: [DeviceResponseDto] })
  async getDevices(
    @CurrentUser('id') userId: string,
  ): Promise<DeviceResponseDto[]> {
    const devices = await this.devicesService.getDevices(userId);
    return devices.map((device) => ({
      ...device,
      capabilities: device.capabilities as Record<string, unknown> | undefined,
      lastSeenAt: device.lastSeenAt ?? undefined,
    }));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiResponse({ status: 200, type: DeviceWithAuthCodeDto })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(
    @CurrentUser('id') userId: string,
    @Param('id') deviceId: string,
  ): Promise<DeviceWithAuthCodeDto> {
    const device = await this.devicesService.getDevice(userId, deviceId);
    return {
      id: device.id,
      name: device.name,
      authCode: device.authCode,
      status: device.status,
      capabilities: device.capabilities as Record<string, unknown>,
      lastSeenAt: device.lastSeenAt ?? undefined,
      createdAt: device.createdAt,
    };
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify device auth code (called by Android Agent)' })
  @ApiResponse({ status: 200, type: VerifyDeviceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid auth code' })
  async verifyDevice(
    @Body() dto: VerifyDeviceDto,
  ): Promise<VerifyDeviceResponseDto> {
    return this.devicesService.verifyDevice(dto);
  }

  @Post(':id/regenerate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate auth code for device' })
  @ApiResponse({ status: 200, type: DeviceWithAuthCodeDto })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async regenerateAuthCode(
    @CurrentUser('id') userId: string,
    @Param('id') deviceId: string,
  ): Promise<DeviceWithAuthCodeDto> {
    const device = await this.devicesService.regenerateAuthCode(
      userId,
      deviceId,
    );
    return {
      id: device.id,
      name: device.name,
      authCode: device.authCode,
      status: device.status,
      capabilities: device.capabilities as Record<string, unknown>,
      lastSeenAt: device.lastSeenAt ?? undefined,
      createdAt: device.createdAt,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete device' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async deleteDevice(
    @CurrentUser('id') userId: string,
    @Param('id') deviceId: string,
  ) {
    return this.devicesService.deleteDevice(userId, deviceId);
  }
}
