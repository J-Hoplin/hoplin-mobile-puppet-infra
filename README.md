# Remote Puppet

> # 설계도(하위 Blueprint Docs)는 공개하지 않습니다 설계도가 필요한 경우에는 개별 연락 주세요

### WebRTC-based Remote Android Device Control System

<div style="display: flex; align-items: center;">
  <div style="flex: 1;">

Remote Puppet is a full-stack system for remotely viewing and controlling Android devices over WebRTC. It provides real-time screen streaming, touch/key input injection, ADB shell access, file management, system metrics monitoring, and logcat streaming — all through a peer-to-peer connection with a NestJS signaling server, React-based Web SDK, and Electron desktop client.

  </div>
</div>

## Monorepo Structure

```
remote-puppet/
├── server/          # NestJS Signaling + REST API Server
├── web-sdk/         # React Component Library & Core Client
├── desktop/         # Electron Desktop Application
├── proto/           # Protocol Buffers Definitions
├── docker/          # Docker & TURN Server Configuration
└── docs/            # Design Documents
```

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL + TURN server)
yarn docker:dev

# 2. Run database migrations
yarn db:migrate

# 3. Start server + desktop app concurrently
yarn dev
```

Or run each service individually:

```bash
yarn dev:server     # NestJS server on :3000
yarn dev:desktop    # Electron desktop app
yarn dev:sdk        # Web SDK dev mode
```

## Highlights

- **Peer-to-Peer Screen Streaming** – WebRTC MediaStream delivers H.264/VP9 encoded video directly between the Android agent and desktop client, bypassing the server for minimal latency.
- **5 WebRTC Data Channels** – dedicated channels for control (touch/key), metrics, shell, logs, and file operations, each with tuned reliability settings for their use case.
- **Reusable React SDK** – `@remote-puppet/web-sdk` exports both core client classes and ready-made React components (`RemoteScreen`, `MetricsPanel`, `AdbShell`, `LogViewer`, `FileExplorer`) with a `useRemoteDevice` hook for easy integration.
- **Electron Desktop Client** – tabbed control interface (Screen, Shell, Logs, Files) with Zustand state management, built for macOS, Windows, and Linux via electron-builder.
- **NestJS Signaling Server** – handles WebRTC negotiation, JWT authentication (user & device tokens), device registration with 6-character auth codes, and session management backed by PostgreSQL via Prisma ORM.
- **Containerized Infrastructure** – Docker Compose with PostgreSQL 15 and CoTURN (STUN/TURN) for NAT traversal, supporting both development and production deployments.
- **Chunked File Transfer** – upload and download files in 64KB Base64 chunks over the WebRTC `file` data channel with progress tracking.
- **Swagger API Documentation** – auto-generated REST API docs available at `/api` when the server is running.

## Architecture Overview

```text
┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
│   Desktop    │          │    Signaling      │          │   Android    │
│   Client     │          │    Server         │          │   Agent      │
│  (Electron)  │          │   (NestJS)        │          │  (Kotlin)    │
│              │          │                    │          │              │
│  ┌────────┐  │ Socket.IO│  ┌────────────┐   │Socket.IO │  ┌────────┐ │
│  │Web SDK │──┼──────────┼─▶│  Signaling  │◀──┼──────────┼──│Signaling│ │
│  │        │  │          │  │  Gateway    │   │          │  │ Client │ │
│  └───┬────┘  │          │  └────────────┘   │          │  └────────┘ │
│      │       │          │  ┌────────────┐   │          │              │
│      │       │          │  │  Auth       │   │          │  ┌────────┐ │
│      │       │          │  │  Module     │   │          │  │WebRTC  │ │
│      │       │  WebRTC  │  └────────────┘   │          │  │Manager │ │
│      └───────┼──(P2P)───┼───────────────────┼──────────┼──│        │ │
│              │          │  ┌────────────┐   │          │  └────────┘ │
│              │          │  │ PostgreSQL │   │          │              │
│              │          │  │  (Prisma)  │   │          │              │
│              │          │  └────────────┘   │          │              │
└──────────────┘          └──────────────────┘          └──────────────┘
                                  │
                          ┌───────┴───────┐
                          │   CoTURN      │
                          │ (STUN/TURN)   │
                          └───────────────┘
```

## Packages

### Server (`server/`)

NestJS application providing REST API and WebSocket signaling.

| Module | Description |
|--------|-------------|
| **AuthModule** | JWT-based authentication with bcrypt password hashing (user & device tokens) |
| **DevicesModule** | Device CRUD, 6-character auth code generation, status tracking |
| **SignalingModule** | Socket.IO gateway for WebRTC offer/answer/ICE negotiation and session management |
| **PrismaModule** | PostgreSQL ORM with User, Device, Session models |

### Web SDK (`web-sdk/`)

Dual-export (ESM + CJS) React component library and core client.

**Core Classes:**

| Class | Description |
|-------|-------------|
| `RemotePuppetClient` | Main orchestrator — manages signaling, WebRTC, and all data channels |
| `WebRTCManager` | Peer connection lifecycle, data channel creation with per-channel reliability config |
| `SignalingClient` | Socket.IO wrapper for signaling server communication |

**React Components:**

| Component | Description |
|-----------|-------------|
| `RemoteScreen` | Video element with normalized touch event forwarding |
| `MetricsPanel` | Real-time CPU, memory, battery, temperature, top processes display |
| `AdbShell` | Interactive shell terminal with command history |
| `LogViewer` | Logcat stream with app package filtering |
| `FileExplorer` | File browser with upload/download/delete/mkdir operations |

**Hook:** `useRemoteDevice` — single hook for full device control integration with Zustand store.

### Desktop (`desktop/`)

Electron application wrapping the Web SDK.

| Page | Description |
|------|-------------|
| **LoginPage** | User authentication (register/login) |
| **DevicesPage** | Device listing with real-time status |
| **ControlPage** | Tabbed interface — Screen, Shell, Logs, Files |
| **SettingsPage** | Application settings |

Build targets: macOS (DMG/ZIP), Windows (NSIS/ZIP), Linux (AppImage/DEB)

## Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Server** | NestJS 10, Socket.IO 4.6, Prisma 5.8, PostgreSQL 15, JWT, Swagger |
| **Web SDK** | React 18, TypeScript 5.3, Zustand 4.4, Socket.IO Client 4.6, Vite 5 |
| **Desktop** | Electron 34, React Router 6, electron-builder, Vite |
| **Protocol** | Protocol Buffers 3 (schema definitions) |
| **Infra** | Docker, Docker Compose, CoTURN (STUN/TURN) |

## Database Schema

```text
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   User   │       │    Device    │       │  Session  │
├──────────┤       ├──────────────┤       ├──────────┤
│ id       │──┐    │ id           │──┐    │ id       │
│ email    │  │    │ name         │  │    │ userId   │
│ password │  ├───▶│ authCode     │  ├───▶│ deviceId │
│ createdAt│  │    │ status       │  │    │ startedAt│
│ updatedAt│  │    │ ownerId (FK) │  │    │ endedAt  │
└──────────┘  │    │ capabilities │  │    └──────────┘
              │    │ lastSeenAt   │  │
              │    └──────────────┘  │
              │                     │
              └─────────────────────┘
```

**DeviceStatus:** `ONLINE` | `OFFLINE` | `BUSY`

## Docker Services

### Production (`docker-compose.yml`)

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `server` | Built from Dockerfile | 3000 | NestJS API + Signaling |
| `db` | postgres:15 | 5432 | PostgreSQL with health checks |
| `turn` | coturn/coturn | 3478, 5349, 49152-49200 | STUN/TURN for NAT traversal |

### Development (`docker-compose.dev.yml`)

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `db` | postgres:15 | 5432 | PostgreSQL |
| `turn` | coturn/coturn | 3478, 5349, 49152-49200 | STUN/TURN |

> Development mode runs only DB and TURN — the NestJS server runs locally with hot-reload via `yarn dev:server`.

## Environment Variables

### Local Development (`server/.env`)

Used when running the server locally with `yarn dev:server`. DB and TURN run in Docker while the server runs on your host machine.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (localhost) | `postgresql://postgres:postgres@localhost:5432/remote_puppet?schema=public` |
| `JWT_SECRET` | Secret key for JWT token signing | (required, change in production) |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `PORT` | Server listen port | `3000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `TURN_SERVER_URL` | TURN server URL (use host LAN IP) | `turn:172.30.1.59:3478` |
| `TURN_SERVER_USERNAME` | TURN auth username | `turnuser` |
| `TURN_SERVER_CREDENTIAL` | TURN auth password | `turnpassword` |
| `TURN_SECRET` | TURN shared secret | (required) |

### Docker Deployment (`docker/.env.docker`)

Used when running the full stack in Docker with `yarn docker:up`.

```bash
cp docker/.env.docker.example docker/.env.docker
```

| Variable | Description | Local vs Docker |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | `localhost` → `db` (Docker service name) |
| `TURN_SERVER_URL` | TURN server URL | Must use host LAN IP (**not** Docker service name `turn`) |
| `POSTGRES_USER` | PostgreSQL user | Used by the DB container |
| `POSTGRES_PASSWORD` | PostgreSQL password | Used by the DB container |
| `POSTGRES_DB` | PostgreSQL database name | Used by the DB container |

> **Important:** `TURN_SERVER_URL` is the address the server sends to clients (Android/Desktop). Since clients are outside the Docker network, you must use the **host machine's actual IP**, not the Docker service name `turn`.

```bash
ipconfig getifaddr en0          # macOS
hostname -I | awk '{print $1}'  # Linux
```

### TURN Server (`docker/turnserver.conf`)

| Setting | Description | Note |
|---------|-------------|------|
| `external-ip` | External IP advertised to clients | Must match your host LAN IP or public IP |
| `user` | TURN auth credentials | Must match `TURN_SERVER_USERNAME:TURN_SERVER_CREDENTIAL` in `.env` |
| `realm` | TURN realm | Default: `remotepuppet.local` |

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Run server + desktop concurrently |
| `yarn dev:server` | Server with hot-reload |
| `yarn dev:desktop` | Desktop in dev mode |
| `yarn dev:sdk` | Web SDK dev mode |
| `yarn build` | Build all packages |
| `yarn build:desktop` | Build desktop installers |
| `yarn docker:dev` | Start dev containers (DB + TURN) |
| `yarn docker:up` | Start production containers |
| `yarn db:migrate` | Run Prisma migrations |
| `yarn db:studio` | Open Prisma Studio |
| `yarn clean` | Remove all build artifacts |

## API Documentation

Swagger UI is available at `http://localhost:3000/api` when the server is running.

## WebSocket Signaling Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `session:join` | Client → Server | Join a device control session |
| `session:leave` | Client → Server | Leave session |
| `webrtc:offer` | User → Device | SDP offer |
| `webrtc:answer` | Device → User | SDP answer |
| `webrtc:ice-candidate` | Bidirectional | ICE candidate exchange |
| `device:status` | Server → Client | Device online/offline notification |
| `device:list` | User → Server | Request owned device list |
| `turn:credentials` | User → Server | Request TURN server credentials |

## Author

**J-Hoplin / 윤준호**

- Contact: hoplin.dev@gmail.com
- GitHub: [J-Hoplin](https://github.com/J-Hoplin)

## License

This project is licensed under a **Custom Proprietary License** — non-commercial use only. Commercial use requires prior written permission from the author. See [LICENSE](./LICENSE) for details.

## Design Documents

Detailed design documents are available in the `docs/` directory:

- [System Blueprint](./docs/system-blueprint.md) — overall architecture, data flows, state machines
- [Server Design](./docs/Server-Design.md) — signaling gateway, auth, device management
- [Web SDK Design](./docs/WebSDK-Design.md) — client API, React components, data channel protocol
- [Desktop Design](./docs/Desktop-Design.md) — Electron app structure, pages, state management
- [Android Agent Design](./docs/Android-Design.md) — agent service, WebRTC, input injection, metrics
