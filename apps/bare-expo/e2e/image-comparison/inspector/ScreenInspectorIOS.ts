#!/usr/bin/env bun

import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';

type InspectorRequestBody =
  | {
      action: 'getCoordinates';
      accessibilityId: string;
    }
  | {
      action: 'captureView';
      accessibilityId: string;
      // Path where the inspector writes the captured PNG.
      outputPath: string;
    };

type InspectorRequest = InspectorRequestBody & {
  // Unique response pipe created by the client for this request, so that a response can never
  // pair with another request's reader; see resolveResponsePipePath in ScreenInspector.swift.
  responsePipe: string;
};

let nextRequestId = 0;

interface InspectorResponse {
  success: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  path?: string;
  width?: number;
  height?: number;
  error: string;
}

export function getDylibPath(): string {
  const frameworkName = 'IOSScreenInspectorFramework.framework';
  const frameworkPath = path.resolve(__dirname, 'bin', frameworkName);
  const binaryPath = path.join(frameworkPath, 'IOSScreenInspectorFramework');

  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Dylib not found at ${binaryPath}. Build it first by running: cd ${path.dirname(path.join(frameworkPath, '..'))} && ./scripts/build.sh`
    );
  }

  return binaryPath;
}

export class ScreenInspectorIOS {
  private requestPipePath = '/tmp/ios_screen_inspector_request';
  private responsePipePath = '/tmp/ios_screen_inspector_response';

  async getCoordinates(
    accessibilityId: string,
    timeoutMs: number = 15000
  ): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const response = await this.sendRequest(
      {
        action: 'getCoordinates',
        accessibilityId,
      },
      timeoutMs
    );

    if (!response.success) {
      throw new Error(`Get coordinates failed: ${response.error}`);
    }

    if (!response.bounds) {
      throw new Error('No bounds returned in response');
    }

    return response.bounds;
  }

  async captureView(
    accessibilityId: string,
    outputPath: string,
    timeoutMs: number = 15000
  ): Promise<string> {
    const response = await this.sendRequest(
      {
        action: 'captureView',
        accessibilityId,
        outputPath,
      },
      timeoutMs
    );

    if (!response.success) {
      throw new Error(`Capture view failed: ${response.error}`);
    }

    if (!response.path) {
      throw new Error('No output path returned in response');
    }

    return response.path;
  }

  private async sendRequest(
    request: InspectorRequestBody,
    timeoutMs: number
  ): Promise<InspectorResponse> {
    const responsePipePath = `${this.responsePipePath}_${process.pid}_${nextRequestId++}`;

    await spawnAsync('mkfifo', [responsePipePath]);
    let responseFd: number | null = null;
    try {
      // Open the read end first (non-blocking, so this doesn't wait for a writer): the dylib's
      // write-open then succeeds immediately, and polling with a deadline below means an
      // abandoned request leaks nothing.
      responseFd = fs.openSync(responsePipePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);

      await this.writeToNamedPipe(this.requestPipePath, {
        ...request,
        responsePipe: responsePipePath,
      });

      return await this.pollResponse(responseFd, timeoutMs);
    } catch (error: any) {
      console.error(`❌ iOS ${request.action} request failed:`, error.message);
      throw error;
    } finally {
      if (responseFd != null) {
        fs.closeSync(responseFd);
      }
      fs.rmSync(responsePipePath, { force: true });
    }
  }

  private async writeToNamedPipe(
    pipePath: string,
    request: InspectorRequest,
    timeoutMs: number = 10000
  ): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(request), 'utf8');
    console.log(`📤 Sending request: ${buffer.toString()}`);

    // Open the write end non-blocking: it fails with ENXIO while the inspector isn't reading
    // (e.g. still busy with a previous request or not running), so poll with a deadline. A
    // blocking open would park a file descriptor forever when the inspector is gone, and
    // enough of those exhaust the fs thread pool and starve every later lookup.
    const deadline = Date.now() + timeoutMs;
    let fd: number | null = null;
    try {
      while (fd == null) {
        try {
          fd = fs.openSync(pipePath, fs.constants.O_WRONLY | fs.constants.O_NONBLOCK);
        } catch (error: any) {
          if (error.code !== 'ENXIO' || Date.now() >= deadline) {
            throw new Error(`Failed to open pipe ${pipePath} for writing: ${error.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      const bytesWritten = fs.writeSync(fd, buffer);
      if (bytesWritten !== buffer.length) {
        throw new Error(
          `Partial write to pipe ${pipePath}: ${bytesWritten}/${buffer.length} bytes`
        );
      }
    } finally {
      if (fd != null) {
        fs.closeSync(fd);
      }
    }
  }

  private async pollResponse(fd: number, timeoutMs: number): Promise<InspectorResponse> {
    const buffer = Buffer.alloc(4096);
    const deadline = Date.now() + timeoutMs;

    console.log('📥 Waiting for response...');

    // The fd is non-blocking: reads return 0 bytes while no writer has connected yet and throw
    // EAGAIN while a writer is connected but hasn't written, so poll until data or deadline.
    while (Date.now() < deadline) {
      let bytesRead = 0;
      try {
        bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      } catch (error: any) {
        if (error.code !== 'EAGAIN') {
          throw new Error(`Failed to read from response pipe: ${error.message}`);
        }
      }

      if (bytesRead > 0) {
        const data = buffer.subarray(0, bytesRead).toString('utf8');
        const json = JSON.parse(data);
        console.log(`📨 Response received: ${JSON.stringify(json, null, 2)}`);
        return json;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Timed out waiting for the inspector response after ${timeoutMs}ms`);
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
