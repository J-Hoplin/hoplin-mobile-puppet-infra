import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DevicesService } from './devices.service';

/**
 * Scheduler that periodically checks for stale devices
 * and marks them as OFFLINE if they haven't sent a heartbeat.
 */
@Injectable()
export class DeviceTimeoutScheduler {
  private readonly logger = new Logger(DeviceTimeoutScheduler.name);

  // Timeout in milliseconds (60 seconds)
  private readonly DEVICE_TIMEOUT_MS = 60 * 1000;

  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Runs every 30 seconds to check for stale devices.
   * Devices that haven't been seen within DEVICE_TIMEOUT_MS will be marked as OFFLINE.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleDeviceTimeout() {
    try {
      const count = await this.devicesService.markStaleDevicesOffline(
        this.DEVICE_TIMEOUT_MS,
      );

      if (count > 0) {
        this.logger.log(`Marked ${count} stale device(s) as OFFLINE`);
      }
    } catch (error) {
      this.logger.error('Failed to check for stale devices', error);
    }
  }
}
