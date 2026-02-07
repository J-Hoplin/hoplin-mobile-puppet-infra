import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { FoldersModule } from './folders/folders.module';
import { SignalingModule } from './signaling/signaling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DevicesModule,
    FoldersModule,
    SignalingModule,
  ],
})
export class AppModule {}
