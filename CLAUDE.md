# Remote Puppet Infrastructure

Yarn Workspaces-based monorepo containing NestJS server, Web SDK, and Electron desktop app.

## Monorepo Structure

```
├── server/      # @remote-puppet/server - NestJS backend
├── web-sdk/     # @remote-puppet/web-sdk - React component library
├── desktop/     # @remote-puppet/desktop - Electron app
├── docker/      # Docker Compose configs
└── proto/       # Protocol Buffers definitions
```

## Quick Commands

```bash
# Development
yarn docker:dev      # Start PostgreSQL + CoTURN
yarn db:migrate      # Run Prisma migrations
yarn dev             # Run server + desktop concurrently

# Individual services
yarn dev:server      # NestJS server (port 3000)
yarn dev:desktop     # Electron app
yarn dev:sdk         # Web SDK dev mode

# Build
yarn build           # Build all packages
yarn build:desktop   # Build desktop installers

# Database
yarn db:studio       # Open Prisma Studio
```

## Environment Variables

```bash
DATABASE_URL=postgresql://puppet:puppet@localhost:5432/remote_puppet
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
TURN_CREDENTIAL=turnpassword
```

## Tech Stack

| Package | Technologies |
|---------|-------------|
| server | NestJS 10, Socket.IO 4.6, Prisma 5.8, JWT, Swagger |
| web-sdk | React 18, TypeScript, Zustand 4.4, Vite 5 |
| desktop | Electron 34, React Router 6, electron-builder |

## Server Modules

- **AuthModule**: JWT authentication (user/device tokens)
- **DevicesModule**: Device CRUD, 6-digit auth code generation
- **SignalingModule**: Socket.IO WebRTC signaling gateway
- **PrismaModule**: PostgreSQL ORM (User, Device, Session models)

## Web SDK Exports

**Core Classes**:
- `RemotePuppetClient` - Main orchestrator client
- `WebRTCManager` - PeerConnection management
- `SignalingClient` - Socket.IO wrapper

**React Components**:
- `RemoteScreen` - Screen streaming + touch input
- `MetricsPanel` - System metrics display
- `AdbShell` - Shell terminal
- `LogViewer` - Logcat viewer
- `FileExplorer` - File browser

**Hook**: `useRemoteDevice()` - Zustand store integration

## DataChannel Protocol

| Channel | Direction | Purpose |
|---------|-----------|---------|
| control | Desktop → Agent | Touch/key input |
| metrics | Agent → Desktop | CPU/Memory/Battery |
| shell | Bidirectional | Shell command execution |
| logs | Agent → Desktop | Logcat streaming |
| file | Bidirectional | File transfer (64KB chunks) |

## Signaling Events

```
session:join          # Join device session
session:leave         # Leave session
webrtc:offer          # SDP Offer
webrtc:answer         # SDP Answer
webrtc:ice-candidate  # ICE Candidate
device:status         # Device status change
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| db | 5432 | PostgreSQL 15 |
| turn | 3478, 5349 | CoTURN (STUN/TURN) |

## API Documentation

Swagger UI available at `http://localhost:3000/api` when server is running.
