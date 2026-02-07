import { Module, forwardRef } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DeviceTimeoutScheduler } from './device-timeout.scheduler';
import { AuthModule } from '../auth/auth.module';
import { SignalingModule } from '../signaling/signaling.module';

@Module({
  imports: [AuthModule, forwardRef(() => SignalingModule)],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceTimeoutScheduler],
  exports: [DevicesService],
})
export class DevicesModule {}
