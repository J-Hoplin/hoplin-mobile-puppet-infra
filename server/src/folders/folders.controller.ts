import {
  Controller,
  Get,
  Post,
  Patch,
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
import { FoldersService } from './folders.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderResponseDto,
  FolderWithStatsDto,
  FolderWithDevicesDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('folders')
@Controller('folders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({ status: 201, type: FolderResponseDto })
  async createFolder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.foldersService.createFolder(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all folders with device counts' })
  @ApiResponse({ status: 200, type: [FolderWithStatsDto] })
  async getFolders(
    @CurrentUser('id') userId: string,
  ): Promise<FolderWithStatsDto[]> {
    return this.foldersService.getFolders(userId);
  }

  @Get('uncategorized')
  @ApiOperation({ summary: 'Get devices without folder assignment' })
  @ApiResponse({ status: 200 })
  async getUncategorizedDevices(@CurrentUser('id') userId: string) {
    const devices = await this.foldersService.getUncategorizedDevices(userId);
    return {
      id: null,
      name: 'Uncategorized',
      devices,
      deviceCount: devices.length,
      onlineCount: devices.filter((d) => d.status === 'ONLINE').length,
      offlineCount: devices.filter((d) => d.status === 'OFFLINE').length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder with devices' })
  @ApiResponse({ status: 200, type: FolderWithDevicesDto })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  async getFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
  ): Promise<FolderWithDevicesDto> {
    return this.foldersService.getFolder(userId, folderId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update folder' })
  @ApiResponse({ status: 200, type: FolderResponseDto })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  async updateFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
    @Body() dto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.foldersService.updateFolder(userId, folderId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete folder (devices become uncategorized)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  async deleteFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
  ) {
    return this.foldersService.deleteFolder(userId, folderId);
  }
}
