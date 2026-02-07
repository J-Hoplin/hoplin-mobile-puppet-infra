export enum SignalType {
  // Authentication
  AUTH_REQUEST = 'auth:request',
  AUTH_RESPONSE = 'auth:response',

  // Device status
  DEVICE_REGISTER = 'device:register',
  DEVICE_STATUS = 'device:status',
  DEVICE_LIST = 'device:list',

  // WebRTC Signaling
  OFFER = 'webrtc:offer',
  ANSWER = 'webrtc:answer',
  ICE_CANDIDATE = 'webrtc:ice-candidate',

  // Session management
  SESSION_JOIN = 'session:join',
  SESSION_LEAVE = 'session:leave',
  SESSION_USERS = 'session:users',

  // Connection state
  CONNECTION_STATE = 'connection:state',
  RECONNECT = 'connection:reconnect',

  // Errors
  ERROR = 'error',
}

export interface AuthenticatedSocket {
  id: string;
  userId?: string;
  deviceId?: string;
  type: 'user' | 'device';
  rooms: Set<string>;
}

export interface WebRTCOffer {
  targetDeviceId?: string;  // When user sends offer to device
  targetUserId?: string;    // When device sends offer to user
  sdp: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
  targetUserId?: string;    // When device sends answer to user
  targetDeviceId?: string;  // When user sends answer to device
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  targetId: string;
  candidate: RTCIceCandidateInit;
}

export interface SessionJoinRequest {
  deviceId: string;
}

export interface SessionUser {
  id: string;
  email?: string;
  joinedAt: Date;
}

export interface DeviceStatusUpdate {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
}
