import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateFolderDto, UpdateFolderDto } from './dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async createFolder(userId: string, dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        ownerId: userId,
      },
    });
  }

  async getFolders(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { ownerId: userId },
      include: {
        devices: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      deviceCount: folder.devices.length,
      onlineCount: folder.devices.filter((d) => d.status === 'ONLINE').length,
      offlineCount: folder.devices.filter((d) => d.status === 'OFFLINE').length,
    }));
  }

  async getFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        devices: {
          select: {
            id: true,
            name: true,
            status: true,
            lastSeenAt: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return folder;
  }

  async updateFolder(userId: string, folderId: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        name: dto.name,
      },
    });
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Devices in this folder will have folderId set to null (due to onDelete: SetNull)
    await this.prisma.folder.delete({
      where: { id: folderId },
    });

    return { success: true };
  }

  async getUncategorizedDevices(userId: string) {
    return this.prisma.device.findMany({
      where: {
        ownerId: userId,
        folderId: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
