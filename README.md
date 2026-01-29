# Remote Puppet

WebRTC 기반 원격 Android 기기 조종 시스템

## 프로젝트 구조

```
remote-puppet/
├── server/          # NestJS 서버 (Signaling + REST API)
├── desktop/         # Electron Desktop 클라이언트
├── web-sdk/         # React 컴포넌트 라이브러리
├── proto/           # Protocol Buffers 정의
├── docker/          # Docker 설정
└── docs/            # 상세 문서
```

## 주요 기능

- **실시간 화면 공유** - WebRTC MediaStream
- **원격 조종** - 터치, 드래그, 시스템 버튼 (Back, Home, Recent)
- **ADB Shell** - 원격 터미널 접속
- **파일 관리** - 탐색, 업로드, 다운로드, 삭제
- **실시간 메트릭** - CPU, Memory, Battery, Temperature
- **로그 뷰어** - 앱별 Logcat 실시간 스트리밍
- **기기 관리** - 이름 변경, 삭제 (실시간 동기화)

## 기술 스택

| 컴포넌트 | 기술 |
|----------|------|
| Server | NestJS, Socket.io, Prisma, PostgreSQL |
| Desktop | Electron, React, TypeScript |
| Web SDK | React, Zustand, Vite |
| Android | Kotlin, WebRTC, Accessibility Service |

## 시작하기

### 서버 실행

```bash
cd server
yarn install
yarn dev
```

### Desktop 앱 실행

```bash
cd desktop
yarn install
yarn dev
```

## 문서

- [기획 및 아키텍처](./docs/PLANNING.md)
- [구현 상세](./docs/IMPLEMENTATION_DETAILS.md)

## API 문서

서버 실행 후 Swagger UI: http://localhost:3000/api
