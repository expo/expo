/* eslint-env jest */
import { ExpoUpdatesManifest } from '@expo/config';
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import assert from 'assert';
import spawn from 'cross-spawn';
import { ChildProcess } from 'child_process';
import { once } from 'events';
import { EventEmitter } from 'fbemitter';
import stripAnsi from 'strip-ansi';
import treeKill from 'tree-kill';

export const bin = require.resolve('../../build/bin/cli');

export class ExpoStartCommand extends EventEmitter {
  protected cliOutput: string = '';

  url: string | undefined;

  private isStopping: boolean = false;
  private childProcess?: ChildProcess;

  constructor(
    public projectRoot: string,
    public env: NodeJS.ProcessEnv = {}
  ) {
    super();
  }

  public async stopAsync(): Promise<void> {
    this.isStopping = true;
    if (this.childProcess) {
      const exitPromise = once(this.childProcess, 'exit');
      await new Promise<void>((resolve) => {
        treeKill(this.childProcess!.pid!, 'SIGKILL', (err) => {
          if (err) {
            console.error('tree-kill', err);
          }
          resolve();
        });
      });
      this.childProcess.kill('SIGKILL');
      await exitPromise;
      this.childProcess = undefined;
      console.log(`Stopped expo server`);
    }
  }

  private parseStdio(childProcess: ChildProcess) {
    childProcess.stdout?.on('data', (chunk) => {
      const msg = chunk.toString();
      if (!process.env.CI) process.stdout.write(chunk);
      this.cliOutput += msg;
      this.emit('stdout', [msg]);
    });
    childProcess.stderr?.on('data', (chunk) => {
      const msg = chunk.toString();
      if (!process.env.CI) process.stderr.write(chunk);
      this.cliOutput += msg;
      this.emit('stderr', [msg]);
    });
  }

  getUrl(): string {
    assert(this.url, 'expo server not started');
    return this.url;
  }

  fetchAsync(url: string, init?: RequestInit | undefined) {
    const serverUrl = new URL(url, this.getUrl());
    return fetch(serverUrl, init);
  }

  fetchAsExpoGoIosAsync(url: string) {
    return this.fetchAsync(url, {
      headers: {
        // TODO: Match up all headers
        'expo-platform': 'ios',
        Accept: 'multipart/mixed',
      },
    });
  }

  async fetchExpoGoManifestAsync(): Promise<ExpoUpdatesManifest> {
    const response = await this.fetchAsExpoGoIosAsync('/');

    const multipartParts = await parseMultipartMixedResponseAsync(
      response.headers.get('content-type') as string,
      await response.arrayBuffer().then((buffer) => Buffer.from(buffer))
    );

    const manifestPart = multipartParts.find((part) => isMultipartPartWithName(part, 'manifest'));

    assert(manifestPart, 'manifest part not found');

    return JSON.parse(manifestPart.body);
  }

  async fetchBundleAsync(url: string): Promise<string> {
    const res = await fetch(url);

    // NOTE: This is the same Metro error handling we use elsewhere.
    if (res.status === 500) {
      const text = await res.text();
      if (
        text.startsWith('{"originModulePath"') ||
        text.startsWith('{"type":"TransformError"') ||
        text.startsWith('{"type":"InternalError"')
      ) {
        const errorObject = JSON.parse(text);

        throw new Error(stripAnsi(errorObject.message) ?? errorObject.message);
      }
      throw new Error(`[${res.status}]: ${res.statusText}\n${text}`);
    }

    return await res.text();
  }

  flushErrors() {
    this.cliOutput.split('\n').forEach((line) => {
      if (line.match(/Error:/i)) {
        throw new Error(line);
      }
    });
  }

  async startAsync(args: string[] = []) {
    if (this.childProcess) {
      throw new Error('expo already started');
    }
    this.cliOutput = '';

    const cmdArgs = ['yarn', 'expo', 'start', ...args].filter(Boolean) as string[];

    console.log('$', cmdArgs.join(' '));
    await new Promise<void>((resolve, reject) => {
      try {
        this.childProcess = spawn(cmdArgs[0], cmdArgs.slice(1), {
          cwd: this.projectRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          env: {
            CI: '1',
            ...process.env,
            ...this.env,
            NODE_ENV: this.env.NODE_ENV || ('' as any),
            __EXPO_E2E_TEST: '1',
          },
        });

        this.cliOutput = '';

        this.parseStdio(this.childProcess);

        this.childProcess.on('close', (code, signal) => {
          if (this.isStopping) return;
          if (code || signal) {
            console.error(`'${cmdArgs.join(' ')}' exited unexpectedly with: ${code || signal}`);
          }
        });
        const isReadyCallback = (message: string) => {
          const resolveServer = () => {
            try {
              new URL(this.url!);
            } catch (err) {
              reject({
                err,
                msg: message,
              });
            }
            resolve();
          };

          for (const rawStr of stripAnsi(message)) {
            const tag = '[__EXPO_E2E_TEST:server]';
            if (rawStr.includes(tag)) {
              const matchedLine = rawStr
                .split('\n')
                ?.find((line) => line.includes(tag))
                ?.split(/\[__EXPO_E2E_TEST:server\]/)
                ?.pop()
                ?.trim();
              if (!matchedLine) {
                return reject(new Error('Failed to parse server URL: ' + message));
              }
              this.url = JSON.parse(matchedLine).url;
              callback.remove();
              return resolveServer();
            } else if (/Use port \d+ instead/.test(rawStr) || /Skipping dev server/.test(rawStr)) {
              callback.remove();
              // Port is busy, throw an error
              return reject(new Error('Port is busy'));
            }
          }
        };
        const callback = this.addListener('stdout', isReadyCallback);
      } catch (err) {
        console.error(`Failed to run ${cmdArgs.join(' ')}`, err);
        setTimeout(() => process.exit(1), 0);
      }
    });
  }
}

export abstract class ServeAbstractCommand extends EventEmitter {
  protected cliOutput: string = '';

  url: string | undefined;

  private isStopping: boolean = false;
  private childProcess?: import('child_process').ChildProcess;

  constructor(
    public projectRoot: string,
    public env: NodeJS.ProcessEnv = {}
  ) {
    super();
  }

  public async stopAsync(): Promise<void> {
    this.isStopping = true;
    if (this.childProcess) {
      const exitPromise = once(this.childProcess, 'exit');
      await new Promise<void>((resolve) => {
        treeKill(this.childProcess!.pid!, 'SIGKILL', (err) => {
          if (err) {
            console.error('tree-kill', err);
          }
          resolve();
        });
      });
      this.childProcess.kill('SIGKILL');
      await exitPromise;
      this.childProcess = undefined;
      console.log(`Stopped npx serve`);
    }
  }

  private parseStdio(childProcess: ChildProcess) {
    childProcess.stdout?.on('data', (chunk) => {
      const msg = chunk.toString();
      if (!process.env.CI) process.stdout.write(chunk);
      this.cliOutput += msg;
      this.emit('stdout', [msg]);
    });
    childProcess.stderr?.on('data', (chunk) => {
      const msg = chunk.toString();
      if (!process.env.CI) process.stderr.write(chunk);
      this.cliOutput += msg;
      this.emit('stderr', [msg]);
    });
  }

  getUrl(): string {
    assert(this.url, 'serve not started');
    return this.url;
  }

  fetchAsync(url: string, init?: RequestInit | undefined) {
    const serverUrl = new URL(url, this.getUrl());
    return fetch(serverUrl, init);
  }

  flushErrors() {
    this.cliOutput.split('\n').forEach((line) => {
      if (line.match(/Error:/i)) {
        throw new Error(line);
      }
    });
  }

  abstract isReadyCallback(message: string): boolean;

  async startAsync(args: string[] = []) {
    if (this.childProcess) {
      throw new Error('serve already started');
    }
    this.cliOutput = '';

    const cmdArgs = args.filter(Boolean) as string[];

    console.log('$', cmdArgs.join(' '));
    return new Promise<void>((resolve, reject) => {
      try {
        this.childProcess = spawn(cmdArgs[0], cmdArgs.slice(1), {
          cwd: this.projectRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          env: {
            CI: '1',
            ...process.env,
            ...this.env,
            NODE_ENV: this.env.NODE_ENV || ('' as any),
          },
        });

        this.cliOutput = '';

        this.parseStdio(this.childProcess);

        this.childProcess.on('close', (code, signal) => {
          if (this.isStopping) return;
          if (code || signal) {
            const errMessage = `'${cmdArgs.join(' ')}' exited unexpectedly with: ${code || signal}`;
            console.error(errMessage);
            reject(new Error(errMessage));
          }
        });
        const isReadyCallback = (message: string) => {
          try {
            if (this.isReadyCallback(message)) {
              callback.remove();
              new URL(this.url!);
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        };
        const callback = this.addListener('stdout', isReadyCallback);
      } catch (err) {
        console.error(`Failed to run ${cmdArgs.join(' ')}`, err);
        setTimeout(() => process.exit(1), 0);
      }
    });
  }
}

export class ServeStaticCommand extends ServeAbstractCommand {
  isReadyCallback(message: string): boolean {
    const tag = 'Accepting connections at ';
    for (const rawStr of stripAnsi(message)) {
      if (rawStr.includes(tag)) {
        const matchedLine = rawStr
          .split('\n')
          ?.find((line) => line.includes(tag))
          ?.split(/Accepting connections at\s+/)
          ?.pop()
          ?.trim();
        if (!matchedLine) {
          return false;
        }
        this.url = matchedLine;
        return true;
      }
    }
    return false;
  }

  async startAsync(args: string[] = []) {
    return super.startAsync(['npx', 'serve', ...args]);
  }
}

export class ExpoServeLocalCommand extends ServeAbstractCommand {
  isReadyCallback(message: string): boolean {
    const tag = 'Server running at ';
    for (const rawStr of stripAnsi(message)) {
      if (rawStr.includes(tag)) {
        const matchedLine = rawStr
          .split('\n')
          ?.find((line) => line.includes(tag))
          ?.split(/Server running at\s+/)
          ?.pop()
          ?.trim();
        if (!matchedLine) {
          return false;
        }
        this.url = matchedLine;
        return true;
      }
    }
    return false;
  }

  async startAsync(args: string[] = []) {
    return super.startAsync(['npx', 'expo', 'serve', ...args]);
  }
}
