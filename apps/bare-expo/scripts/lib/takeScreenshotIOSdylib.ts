import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs';
import os from 'os';
import path from 'path';

interface ScreenshotRequest {
  action: string;
  accessibilityId: string;
  outputPath: string;
  captureMode?: 'visible' | 'full'; // 'visible' = only visible portion, 'full' = entire scrollable content
}

interface ScreenshotResponse {
  success: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  error: string;
}

export class ScreenshotIOS {
  private deviceId: string;
  private verbose: boolean;
  private dylibPath: string;
  private requestPipePath = '/tmp/ios_screenshot_request';
  private responsePipePath = '/tmp/ios_screenshot_response';

  constructor(deviceId: string, verbose: boolean) {
    this.deviceId = deviceId;
    this.verbose = verbose;
    this.dylibPath = this.getDylibPath();
  }

  async takeScreenshotByAccessibilityId({
    accessibilityId,
    outputPath,
    captureMode = 'full',
  }: {
    accessibilityId: string;
    outputPath: string;
    captureMode?: 'visible' | 'full';
  }): Promise<string> {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    const request: ScreenshotRequest = {
      action: 'screenshot',
      accessibilityId,
      outputPath,
      captureMode,
    };

    try {
      console.log(`🔍 Taking screenshot of element: ${accessibilityId}`);
      console.log(`📤 Sending request: ${JSON.stringify(request)}`);

      // Write request to named pipe
      await this.writeToNamedPipe(this.requestPipePath, JSON.stringify(request));
      console.log('✅ Request sent to pipe');

      // Read response from named pipe
      console.log('📥 Waiting for response...');
      const responseData = await this.readFromNamedPipe(this.responsePipePath);
      console.log(`📨 Response received: ${responseData}`);

      const response: ScreenshotResponse = JSON.parse(responseData);

      if (!response.success) {
        throw new Error(`Screenshot failed: ${response.error}`);
      }

      console.log('✅ Screenshot completed successfully');
      return outputPath;
    } catch (error: any) {
      console.error('❌ iOS screenshot failed:', error.message);
      if (this.verbose) {
        console.error('Full error:', error);
      }
      throw error;
    }
  }

  async startSimulatorAppWithDylib(appPath: string, bundleId?: string): Promise<void> {
    const env = {
      ...process.env,
      DYLD_INSERT_LIBRARIES: this.dylibPath,
      SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: this.dylibPath,
    };

    if (bundleId) {
      // Kill app first to ensure clean restart
      try {
        await spawnAsync('xcrun', ['simctl', 'terminate', this.deviceId, bundleId], {
          stdio: 'pipe', // Always pipe to avoid errors if app isn't running
        });
        if (this.verbose) {
          console.log(`Terminated existing ${bundleId} instance`);
        }
      } catch (error) {
        // App might not be running, which is fine
        if (this.verbose) {
          console.log(`App ${bundleId} not running or already terminated`);
        }
      }

      try {
        await spawnAsync(`xcrun`, ['simctl', 'launch', this.deviceId, bundleId], {
          stdio: this.verbose ? 'inherit' : 'pipe',
          env,
        });
      } catch (error: any) {
        console.warn('spawn with dylib failed', error.message);
      }
    } else if (appPath) {
      // Install app first
      await spawnAsync('xcrun', ['simctl', 'install', this.deviceId, appPath], {
        stdio: this.verbose ? 'inherit' : 'pipe',
      });

      // Extract bundle ID from app
      const infoPlistPath = path.join(appPath, 'Info.plist');
      const bundleIdResult = await spawnAsync('plutil', ['-p', infoPlistPath], {
        stdio: 'pipe',
      });

      const bundleIdMatch = bundleIdResult.stdout.match(/"CFBundleIdentifier" => "(.+)"/);
      if (!bundleIdMatch) {
        throw new Error('Could not extract bundle ID from app');
      }

      const extractedBundleId = bundleIdMatch[1];

      // Try spawn with dylib first, fallback to launch
      try {
        await spawnAsync(
          'xcrun',
          ['simctl', 'launch', this.deviceId, '--standalone', extractedBundleId],
          {
            stdio: this.verbose ? 'inherit' : 'pipe',
            env,
          }
        );
      } catch (error: any) {
        console.warn('launch with dylib failed:', error.message);
      }
    } else {
      throw new Error('Either appPath or bundleId must be provided');
    }
  }

  private getDylibPath(): string {
    const frameworkName = 'IOSScreenshotFramework.framework';
    const frameworkPath = path.resolve(__dirname, 'ios-screenshot-dylib/bin', frameworkName);
    const binaryPath = path.join(frameworkPath, 'IOSScreenshotFramework');

    if (this.verbose) {
      console.log(`Framework path: ${frameworkPath}`);
      console.log(`Binary path: ${binaryPath}`);
      console.log(`Framework exists: ${fs.existsSync(frameworkPath)}`);
      console.log(`Binary exists: ${fs.existsSync(binaryPath)}`);
    }

    return binaryPath;
  }

  private async writeToNamedPipe(pipePath: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open the FIFO for writing
      fs.open(pipePath, 'w', (err: any, fd: number) => {
        if (err) {
          reject(new Error(`Failed to open pipe ${pipePath}: ${err.message}`));
          return;
        }

        const buffer = Buffer.from(data, 'utf8');

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

  private async readFromNamedPipe(pipePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Open the FIFO for reading
      fs.open(pipePath, 'r', (err: any, fd: number) => {
        if (err) {
          reject(new Error(`Failed to open pipe ${pipePath}: ${err.message}`));
          return;
        }

        const buffer = Buffer.alloc(4096);

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
          resolve(data);
        });
      });
    });
  }

  async waitForDylibReady(timeoutMs: number = 8000): Promise<void> {
    // For minimal test, just wait a bit for the app to start
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));

    // Check if pipes exist
    const requestPipeExists = fs.existsSync(this.requestPipePath);
    const responsePipeExists = fs.existsSync(this.responsePipePath);

    console.log(`Request pipe exists: ${requestPipeExists} (${this.requestPipePath})`);
    console.log(`Response pipe exists: ${responsePipeExists} (${this.responsePipePath})`);

    console.log('✅ App launched. Check Console.app for dylib loading messages.');
  }
}

// Example usage
if (require.main === module) {
  async function example() {
    const screenshotIOS = new ScreenshotIOS('iPhone 17 Pro', true);

    try {
      // Start app with dylib
      // await screenshotIOS.startSimulatorAppWithDylib('./bare-expo-ios.app', 'dev.expo.Payments');
      // await screenshotIOS.waitForDylibReady();

      // Take screenshot - full scrollable content (default)
      const outputPath = path.join(os.tmpdir(), 'ios-element-screenshot-full.png');
      await screenshotIOS.takeScreenshotByAccessibilityId({
        accessibilityId: 'image-comparison-list',
        outputPath,
        captureMode: 'full', // Captures entire scrollable content
      });
      console.log(`Screenshot saved to: ${outputPath}`);

      // Take screenshot - visible portion only
      const outputPathVisible = path.join(os.tmpdir(), 'ios-element-screenshot-visible.png');
      await screenshotIOS.takeScreenshotByAccessibilityId({
        accessibilityId: 'image-comparison-list',
        outputPath: outputPathVisible,
        captureMode: 'visible', // Captures only visible portion
      });

      console.log(`Screenshot saved to: ${outputPathVisible}`);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  example();
}
