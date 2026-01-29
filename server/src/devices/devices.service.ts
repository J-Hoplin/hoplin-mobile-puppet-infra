import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DeviceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { AuthService } from '../auth/auth.service';
import {
  CreateDeviceDto,
  VerifyDeviceDto,
  VerifyDeviceResponseDto,
} from './dto';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  private generateAuthCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createDevice(userId: string, dto: CreateDeviceDto) {
    let authCode: string;
    let isUnique = false;

    while (!isUnique) {
      authCode = this.generateAuthCode();
      const existing = await this.prisma.device.findUnique({
        where: { authCode },
      });
      isUnique = !existing;
    }

    const device = await this.prisma.device.create({
      data: {
        name: dto.name,
        authCode: authCode!,
        ownerId: userId,
      },
    });

    return device;
  }

  async getDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        status: true,
        capabilities: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async verifyDevice(dto: VerifyDeviceDto): Promise<VerifyDeviceResponseDto> {
    const device = await this.prisma.device.findUnique({
      where: { authCode: dto.authCode.toUpperCase() },
    });

    if (!device) {
      throw new BadRequestException('Invalid auth code');
    }

    if (device.status !== DeviceStatus.OFFLINE) {
      throw new BadRequestException('Device is already registered');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        capabilities: (dto.capabilities || {}) as Prisma.InputJsonValue,
        lastSeenAt: new Date(),
      },
    });

    const accessToken = await this.authService.generateDeviceToken(device.id);

    return {
      deviceId: updatedDevice.id,
      accessToken,
      deviceName: updatedDevice.name,
    };
  }

  async updateDeviceStatus(deviceId: string, status: DeviceStatus) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        status,
        lastSeenAt: new Date(),
      },
    });
  }

  async deleteDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.device.delete({
      where: { id: deviceId },
    });

    return { success: true };
  }

  async regenerateAuthCode(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    let authCode: string;
    let isUnique = false;

    while (!isUnique) {
      authCode = this.generateAuthCode();
      const existing = await this.prisma.device.findUnique({
        where: { authCode },
      });
      isUnique = !existing;
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        authCode: authCode!,
        status: DeviceStatus.OFFLINE,
      },
    });
  }
}
