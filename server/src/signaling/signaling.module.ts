import { Module, forwardRef } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { AuthModule } from '../auth/auth.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [AuthModule, forwardRef(() => DevicesModule)],
  providers: [SignalingGateway],
  exports: [SignalingGateway],
})
export class SignalingModule {}
