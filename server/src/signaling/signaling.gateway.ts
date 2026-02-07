import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { PrismaService } from '../prisma';
import { DevicesService } from '../devices/devices.service';
import {
  SignalType,
  WebRTCOffer,
  WebRTCAnswer,
  IceCandidate,
  SessionJoinRequest,
  SessionUser,
} from './interfaces/signaling.interface';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceId?: string;
  clientType: 'user' | 'device';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/signaling',
})
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SignalingGateway');
  private deviceSessions = new Map<string, Set<string>>();
  private connectedDevices = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private devicesService: DevicesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit(SignalType.ERROR, { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type === 'device') {
        client.deviceId = payload.sub;
        client.clientType = 'device';

        this.connectedDevices.set(payload.sub, client.id);
        this.logger.log(`Device ${payload.sub} added to connectedDevices. Socket ID: ${client.id}`);
        this.logger.log(`Current connectedDevices: [${Array.from(this.connectedDevices.keys()).join(', ')}]`);

        await this.devicesService.updateDeviceStatus(
          payload.sub,
          DeviceStatus.ONLINE,
        );

        const room = `device:${payload.sub}`;
        client.join(room);

        this.server.to(room).emit(SignalType.DEVICE_STATUS, {
          deviceId: payload.sub,
          status: 'ONLINE',
        });

        this.logger.log(`Device ${payload.sub} connected and registered`);
      } else {
        client.userId = payload.sub;
        client.clientType = 'user';

        const room = `user:${payload.sub}`;
        client.join(room);

        this.logger.log(`User ${payload.sub} connected`);
      }

      client.emit(SignalType.AUTH_RESPONSE, { success: true });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.emit(SignalType.ERROR, { message: 'Invalid token' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnecting: type=${client.clientType}, deviceId=${client.deviceId}, userId=${client.userId}, socketId=${client.id}`);

    if (client.clientType === 'device' && client.deviceId) {
      this.connectedDevices.delete(client.deviceId);
      this.logger.log(`Device ${client.deviceId} removed from connectedDevices`);
      this.logger.log(`Remaining connectedDevices: [${Array.from(this.connectedDevices.keys()).join(', ')}]`);

      await this.devicesService.updateDeviceStatus(
        client.deviceId,
        DeviceStatus.OFFLINE,
      );

      const room = `device:${client.deviceId}`;
      this.server.to(room).emit(SignalType.DEVICE_STATUS, {
        deviceId: client.deviceId,
        status: 'OFFLINE',
      });

      const sessions = this.deviceSessions.get(client.deviceId);
      if (sessions) {
        sessions.forEach((userId) => {
          this.server.to(`user:${userId}`).emit(SignalType.SESSION_LEAVE, {
            deviceId: client.deviceId,
            reason: 'device_disconnected',
          });
        });
        this.deviceSessions.delete(client.deviceId);
      }

      this.logger.log(`Device ${client.deviceId} disconnected`);
    } else if (client.clientType === 'user' && client.userId) {
      this.deviceSessions.forEach((users, deviceId) => {
        if (users.has(client.userId!)) {
          users.delete(client.userId!);
          this.server.to(`device:${deviceId}`).emit(SignalType.SESSION_LEAVE, {
            userId: client.userId,
          });
        }
      });

      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage(SignalType.SESSION_JOIN)
  async handleSessionJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SessionJoinRequest,
  ) {
    if (client.clientType !== 'user' || !client.userId) {
      return { error: 'Only users can join sessions' };
    }

    const device = await this.prisma.device.findFirst({
      where: {
        id: data.deviceId,
        owner: { id: client.userId },
      },
    });

    if (!device) {
      return { error: 'Device not found or access denied' };
    }

    if (!this.connectedDevices.has(data.deviceId)) {
      this.logger.error(`Device ${data.deviceId} NOT in connectedDevices!`);
      this.logger.error(`Current connectedDevices: [${Array.from(this.connectedDevices.keys()).join(', ')}]`);
      return { error: 'Device is offline' };
    }
    this.logger.log(`Device ${data.deviceId} is connected, proceeding with session join`);

    const room = `device:${data.deviceId}`;
    client.join(room);

    if (!this.deviceSessions.has(data.deviceId)) {
      this.deviceSessions.set(data.deviceId, new Set());
    }
    this.deviceSessions.get(data.deviceId)!.add(client.userId);

    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
      select: { email: true },
    });

    this.server.to(room).emit(SignalType.SESSION_JOIN, {
      userId: client.userId,
      email: user?.email,
    });

    const sessionUsers: SessionUser[] = [];
    const users = this.deviceSessions.get(data.deviceId);
    if (users) {
      for (const userId of users) {
        const u = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        sessionUsers.push({
          id: userId,
          email: u?.email,
          joinedAt: new Date(),
        });
      }
    }

    await this.prisma.session.create({
      data: {
        userId: client.userId,
        deviceId: data.deviceId,
      },
    });

    this.logger.log(`User ${client.userId} joined session for device ${data.deviceId}`);
    this.logger.log(`Connected devices: [${Array.from(this.connectedDevices.keys()).join(', ')}]`);

    return {
      success: true,
      deviceId: data.deviceId,
      users: sessionUsers,
    };
  }

  @SubscribeMessage(SignalType.SESSION_LEAVE)
  async handleSessionLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deviceId: string },
  ) {
    if (client.clientType !== 'user' || !client.userId) {
      return { error: 'Only users can leave sessions' };
    }

    const room = `device:${data.deviceId}`;
    client.leave(room);

    const users = this.deviceSessions.get(data.deviceId);
    if (users) {
      users.delete(client.userId);
    }

    this.server.to(room).emit(SignalType.SESSION_LEAVE, {
      userId: client.userId,
    });

    await this.prisma.session.updateMany({
      where: {
        userId: client.userId,
        deviceId: data.deviceId,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    this.logger.log(`User ${client.userId} left session for device ${data.deviceId}`);

    return { success: true };
  }

  @SubscribeMessage(SignalType.OFFER)
  async handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: WebRTCOffer,
  ) {
    // Device sends offer to user (Android creates offer for video sending)
    if (client.clientType === 'device') {
      this.logger.log(`*** OFFER *** from device ${client.deviceId} to user ${data.targetUserId}`);

      this.server.to(`user:${data.targetUserId}`).emit(SignalType.OFFER, {
        deviceId: client.deviceId,
        sdp: data.sdp,
      });

      this.logger.log(`Offer forwarded to user: ${data.targetUserId}`);
      return { success: true };
    }

    // Legacy: User sends offer to device (kept for backward compatibility)
    if (client.clientType === 'user' && data.targetDeviceId) {
      const deviceSocketId = this.connectedDevices.get(data.targetDeviceId);
      this.logger.log(`*** OFFER *** from user ${client.userId} to device ${data.targetDeviceId}, deviceSocketId: ${deviceSocketId}`);

      if (!deviceSocketId) {
        this.logger.error(`Device ${data.targetDeviceId} is offline or not connected`);
        return { error: 'Device is offline' };
      }

      this.server.to(deviceSocketId).emit(SignalType.OFFER, {
        userId: client.userId,
        sdp: data.sdp,
      });

      this.logger.log(`Offer forwarded to device socket: ${deviceSocketId}`);
      return { success: true };
    }

    return { error: 'Invalid client type' };
  }

  @SubscribeMessage(SignalType.ANSWER)
  async handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: WebRTCAnswer,
  ) {
    // User sends answer to device (Desktop responds to Android's offer)
    if (client.clientType === 'user' && data.targetDeviceId) {
      const deviceSocketId = this.connectedDevices.get(data.targetDeviceId);
      this.logger.log(`*** ANSWER *** from user ${client.userId} to device ${data.targetDeviceId}, deviceSocketId: ${deviceSocketId}`);

      if (!deviceSocketId) {
        this.logger.error(`Device ${data.targetDeviceId} is offline or not connected`);
        return { error: 'Device is offline' };
      }

      this.server.to(deviceSocketId).emit(SignalType.ANSWER, {
        userId: client.userId,
        sdp: data.sdp,
      });

      this.logger.log(`Answer forwarded to device socket: ${deviceSocketId}`);
      return { success: true };
    }

    // Legacy: Device sends answer to user (kept for backward compatibility)
    if (client.clientType === 'device') {
      this.logger.log(`*** ANSWER *** from device ${client.deviceId} to user ${data.targetUserId}`);

      this.server.to(`user:${data.targetUserId}`).emit(SignalType.ANSWER, {
        deviceId: client.deviceId,
        sdp: data.sdp,
      });

      this.logger.log(`Answer forwarded to user: ${data.targetUserId}`);
      return { success: true };
    }

    return { error: 'Invalid client type' };
  }

  @SubscribeMessage(SignalType.ICE_CANDIDATE)
  async handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: IceCandidate,
  ) {
    if (client.clientType === 'user') {
      const deviceSocketId = this.connectedDevices.get(data.targetId);
      this.logger.debug(`ICE candidate from user ${client.userId} to device ${data.targetId}, socketId: ${deviceSocketId}`);
      if (deviceSocketId) {
        this.server.to(deviceSocketId).emit(SignalType.ICE_CANDIDATE, {
          userId: client.userId,
          candidate: data.candidate,
        });
      }
    } else if (client.clientType === 'device') {
      this.logger.debug(`ICE candidate from device ${client.deviceId} to user ${data.targetId}`);
      this.server.to(`user:${data.targetId}`).emit(SignalType.ICE_CANDIDATE, {
        deviceId: client.deviceId,
        candidate: data.candidate,
      });
    }

    return { success: true };
  }

  @SubscribeMessage(SignalType.DEVICE_LIST)
  async handleDeviceList(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.clientType !== 'user' || !client.userId) {
      return { error: 'Only users can list devices' };
    }

    const devices = await this.prisma.device.findMany({
      where: { ownerId: client.userId },
      select: {
        id: true,
        name: true,
        status: true,
        lastSeenAt: true,
      },
    });

    return { devices };
  }

  getTurnCredentials(): { urls: string; username: string; credential: string } {
    const turnUrl = this.configService.get<string>('TURN_SERVER_URL');
    const turnUsername = this.configService.get<string>('TURN_SERVER_USERNAME');
    const turnCredential = this.configService.get<string>('TURN_SERVER_CREDENTIAL');

    return {
      urls: turnUrl || '',
      username: turnUsername || '',
      credential: turnCredential || '',
    };
  }

  @SubscribeMessage('turn:credentials')
  handleTurnCredentials() {
    const credentials = this.getTurnCredentials();
    this.logger.log(`TURN credentials requested - URL: ${credentials.urls}, Username: ${credentials.username}`);
    return credentials;
  }

  /**
   * Handle device heartbeat.
   * Updates the device's lastSeenAt timestamp to prevent it from being marked as offline.
   */
  @SubscribeMessage('device:heartbeat')
  async handleDeviceHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.clientType !== 'device' || !client.deviceId) {
      return { error: 'Only devices can send heartbeats' };
    }

    try {
      await this.devicesService.updateDeviceHeartbeat(client.deviceId);
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`Failed to update heartbeat for device ${client.deviceId}: ${error.message}`);
      return { error: 'Failed to update heartbeat' };
    }
  }

  // Public method to send events to connected devices
  sendToDevice(deviceId: string, event: string, data: unknown): boolean {
    const socketId = this.connectedDevices.get(deviceId);
    this.logger.log(`sendToDevice: deviceId=${deviceId}, event=${event}, socketId=${socketId}, connectedDevices=${Array.from(this.connectedDevices.keys()).join(',')}`);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }
}
