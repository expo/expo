import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';

import { delay } from './Utils';

export default class BundlerController {
  private process: ChildProcess | undefined;

  constructor(private path: string) {}

  async start() {
    const bundler = spawn('yarn', ['start'], { cwd: this.path, stdio: 'inherit' });
    await delay(1000);
    this.ensureBundlerWasStarted();
    this.process = bundler;
  }

  async stop() {
    try {
      // Fixes:
      // Error: read EIO
      // at TTY.onStreamRead (node:internal/stream_base_commons:211:20)
      // Emitted 'error' event on ReadStream
      const killProcess: (pid: number, timeout: number) => Promise<void> = (pid, timeout) =>
        new Promise<void>((resolve, reject) => {
          const signal = 'SIGTERM';
          process.kill(pid, signal);
          let count = 0;
          const interval = setInterval(() => {
            try {
              process.kill(pid, 0);
            } catch {
              clearInterval(interval);
              // the process does not exists anymore
              resolve();
            }
            if ((count += 100) > timeout) {
              clearInterval(interval);
              reject(new Error('Timeout process kill'));
            }
          }, 100);
        });

      await killProcess(this.process?.pid!, 2000);
    } catch (error) {
      console.log(`Cannot kill bundler: ${error}.`);
    }
  }

  private async ensureBundlerWasStarted() {
    let retries = 10;
    while (retries-- > 0) {
      try {
        const bundlerStatus = await fetch('http://localhost:8081/status');
        if (bundlerStatus.status === 200) {
          return;
        }
      } catch {}

      await delay(500);
    }

    throw new Error("Bundler isn't available.");
  }
}
