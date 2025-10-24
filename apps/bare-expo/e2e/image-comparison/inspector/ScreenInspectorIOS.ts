#!/usr/bin/env bun

import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import path from 'path';

interface CoordinatesRequest {
  action: 'getCoordinates';
  accessibilityId: string;
}

interface InspectorResponse {
  success: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  error: string;
}

export function getDylibPath(): string {
  const frameworkName = 'IOSScreenInspectorFramework.framework';
  const frameworkPath = path.resolve(__dirname, 'bin', frameworkName);
  const binaryPath = path.join(frameworkPath, 'IOSScreenInspectorFramework');

  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Dylib not found at ${binaryPath}. Please build it first by running: cd ${path.dirname(frameworkPath)} && ./scripts/build.sh`
    );
  }

  return binaryPath;
}

export class ScreenInspectorIOS {
  private requestPipePath = '/tmp/ios_screen_inspector_request';
  private responsePipePath = '/tmp/ios_screen_inspector_response';

  async getCoordinates(accessibilityId: string): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const request: CoordinatesRequest = {
      action: 'getCoordinates',
      accessibilityId,
    };

    try {
      await this.writeToNamedPipe(this.requestPipePath, request);

      const response = await this.readFromNamedPipe(this.responsePipePath);

      if (!response.success) {
        throw new Error(`Get coordinates failed: ${response.error}`);
      }

      if (!response.bounds) {
        throw new Error('No bounds returned in response');
      }

      return response.bounds;
    } catch (error: any) {
      console.error('❌ iOS get coordinates failed:', error.message);
      throw error;
    }
  }

  private async writeToNamedPipe(pipePath: string, request: CoordinatesRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open the FIFO for writing
      fs.open(pipePath, 'w', (err: any, fd: number) => {
        if (err) {
          reject(new Error(`Failed to open pipe ${pipePath}: ${err.message}`));
          return;
        }

        const data = JSON.stringify(request);
        const buffer = Buffer.from(data, 'utf8');

        console.log(`📤 Sending request: ${data}`);

        fs.write(fd, buffer, 0, buffer.length, null, (err: any, bytesWritten: number) => {
          fs.close(fd); // Always close the file descriptor

          if (err) {
            reject(new Error(`Failed to write to pipe ${pipePath}: ${err.message}`));
            return;
          }

          if (bytesWritten !== buffer.length) {
            reject(
              new Error(`Partial write to pipe ${pipePath}: ${bytesWritten}/${buffer.length} bytes`)
            );
            return;
          }

          resolve();
        });
      });
    });
  }

  private async readFromNamedPipe(pipePath: string): Promise<InspectorResponse> {
    return new Promise((resolve, reject) => {
      // Open the FIFO for reading
      fs.open(pipePath, 'r', (err: any, fd: number) => {
        if (err) {
          reject(new Error(`Failed to open pipe ${pipePath}: ${err.message}`));
          return;
        }

        const buffer = Buffer.alloc(4096);

        console.log('📥 Waiting for response...');

        fs.read(fd, buffer, 0, buffer.length, null, (err: any, bytesRead: number) => {
          fs.close(fd); // Always close the file descriptor

          if (err) {
            reject(new Error(`Failed to read from pipe ${pipePath}: ${err.message}`));
            return;
          }

          if (bytesRead === 0) {
            reject(new Error(`No data read from pipe ${pipePath}`));
            return;
          }

          const data = buffer.subarray(0, bytesRead).toString('utf8');
          const json = JSON.parse(data);
          console.log(`📨 Response received: ${JSON.stringify(json, null, 2)}`);
          resolve(json);
        });
      });
    });
  }

  async startSimulatorAppWithDylib(
    deviceID: string,
    bundleId: string,
    launchTimeoutMs: number = 10000
  ): Promise<void> {
    const env = {
      ...process.env,
      SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: getDylibPath(),
    };

    try {
      // Kill app first to ensure dylib is loaded on launch
      await spawnAsync('xcrun', ['simctl', 'terminate', deviceID, bundleId], {
        stdio: 'pipe', // Always pipe to avoid errors if app isn't running
      });
    } catch {
      // App might not be running, which is fine
    }

    try {
      await spawnAsync(`xcrun`, ['simctl', 'launch', deviceID, bundleId], {
        stdio: 'inherit',
        env,
      });
      await spawnAsync(
        `xcrun`,
        ['simctl', 'openurl', deviceID, 'bareexpo://components/image/comparison'],
        {
          stdio: 'inherit',
          env,
        }
      );

      // just wait a bit for the app to start
      await new Promise((resolve) => setTimeout(resolve, launchTimeoutMs));

      // Check if pipes exist
      const requestPipeExists = fs.existsSync(this.requestPipePath);
      const responsePipeExists = fs.existsSync(this.responsePipePath);

      console.log(`Request pipe exists: ${requestPipeExists} (${this.requestPipePath})`);
      console.log(`Response pipe exists: ${responsePipeExists} (${this.responsePipePath})`);
    } catch (error: any) {
      console.warn('spawn with dylib failed', error.message);
    }
  }
}

// Example usage
if (require.main === module) {
  async function example(deviceName: string = 'iPhone 17 Pro') {
    const inspector = new ScreenInspectorIOS();

    try {
      await inspector.startSimulatorAppWithDylib(deviceName, 'dev.expo.Payments');

      // Get coordinates only
      const ids = ['image-comparison-list', 'header-Appearance'];
      for (const id of ids) {
        const coords = await inspector.getCoordinates(id);
        console.log(
          `${id} coordinates: x=${coords.x}, y=${coords.y}, width=${coords.width}, height=${coords.height}`
        );
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Usage: ./ScreenInspectorIOS.ts [deviceName]
  // Example: ./ScreenInspectorIOS.ts "iPhone 15 Pro"
  // Default: iPhone 17 Pro
  const deviceName = process.argv[2];
  example(deviceName);
}
