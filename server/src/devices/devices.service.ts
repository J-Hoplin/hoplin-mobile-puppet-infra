import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DeviceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { AuthService } from '../auth/auth.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  VerifyDeviceDto,
  VerifyDeviceResponseDto,
  MoveDeviceToFolderDto,
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

    // Validate folder ownership if folderId is provided
    if (dto.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });
      if (!folder || folder.ownerId !== userId) {
        throw new BadRequestException('Invalid folder');
      }
    }

    const device = await this.prisma.device.create({
      data: {
        name: dto.name,
        authCode: authCode!,
        ownerId: userId,
        folderId: dto.folderId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
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
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
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
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async updateDevice(userId: string, deviceId: string, dto: UpdateDeviceDto) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Validate folder ownership if folderId is provided
    if (dto.folderId !== undefined && dto.folderId !== null) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });
      if (!folder || folder.ownerId !== userId) {
        throw new BadRequestException('Invalid folder');
      }
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.folderId !== undefined && { folderId: dto.folderId }),
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async moveDeviceToFolder(
    userId: string,
    deviceId: string,
    dto: MoveDeviceToFolderDto,
  ) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        ownerId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Validate folder ownership if folderId is provided
    if (dto.folderId !== undefined && dto.folderId !== null) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
      });
      if (!folder || folder.ownerId !== userId) {
        throw new BadRequestException('Invalid folder');
      }
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        folderId: dto.folderId ?? null,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
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
    // Check if device exists before updating
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      console.warn(`[DevicesService] Device not found: ${deviceId}`);
      return null;
    }

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
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find and mark stale devices as OFFLINE.
   * A device is considered stale if it hasn't been seen within the timeout period.
   * @param timeoutMs - Timeout in milliseconds (default: 60000 = 1 minute)
   * @returns Number of devices marked as offline
   */
  async markStaleDevicesOffline(timeoutMs: number = 60000): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeoutMs);

    const result = await this.prisma.device.updateMany({
      where: {
        status: DeviceStatus.ONLINE,
        lastSeenAt: {
          lt: cutoffTime,
        },
      },
      data: {
        status: DeviceStatus.OFFLINE,
      },
    });

    if (result.count > 0) {
      console.log(
        `[DevicesService] Marked ${result.count} stale device(s) as OFFLINE (timeout: ${timeoutMs}ms)`,
      );
    }

    return result.count;
  }

  /**
   * Update device's lastSeenAt timestamp (heartbeat).
   * @param deviceId - The device ID
   */
  async updateDeviceHeartbeat(deviceId: string): Promise<void> {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }
}
