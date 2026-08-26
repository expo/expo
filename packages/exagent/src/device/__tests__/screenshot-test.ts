// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
//
// Three halves, split by where each can be wrong.
//
// The argv is pure and is pinned as a table, because a wrong flag fails only on a machine with a
// device attached to it. The **wiring** — that the Android tool's stdout is handed a file
// descriptor and the iOS tool's is not — is pinned here too, because it is the difference between
// a PNG and an empty file and it is decided in this module. What is *not* here is that the bytes
// survive the trip: that is a property of a real pipe, and `e2e/__tests__/smoke-test.ts` owns it
// against a stub bin that writes a real PNG.

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import { vol } from 'memfs';

import {
  buildScreenshotCommand,
  captureScreenshotAsync,
  defaultScreenshotPath,
} from '../screenshot';

/** The eight bytes every PNG starts with, which is what a capture is checked against. */
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe(buildScreenshotCommand, () => {
  it(`writes the file itself on iOS, because simctl is given the path`, () => {
    const command = buildScreenshotCommand({
      platform: 'ios',
      deviceId: 'C159CF99-9B06-4D2F-BFDC-010A107E2FBC',
      filePath: '/tmp/shot.png',
    });

    expect(command.bin).toBe('xcrun');
    expect(command.args).toEqual([
      'simctl',
      'io',
      'C159CF99-9B06-4D2F-BFDC-010A107E2FBC',
      'screenshot',
      '/tmp/shot.png',
    ]);
    expect(command.output).toBe('file');
    expect(command.display).toContain('/tmp/shot.png');
    expect(command.display).not.toContain('>');
  });

  // `adb shell` runs through a pty that rewrites `\n` as `\r\n`, which corrupts every PNG it
  // carries. `exec-out` is the raw stream, and getting this wrong produces a file that exists and
  // is not an image.
  it(`redirects stdout on Android, and uses exec-out rather than shell`, () => {
    const command = buildScreenshotCommand({
      platform: 'android',
      deviceId: 'emulator-5554',
      filePath: '/tmp/shot.png',
    });

    expect(command.bin).toBe('adb');
    expect(command.args).toEqual(['-s', 'emulator-5554', 'exec-out', 'screencap', '-p']);
    expect(command.args).not.toContain('shell');
    expect(command.output).toBe('stdout');
    expect(command.display).toBe('adb -s emulator-5554 exec-out screencap -p > /tmp/shot.png');
  });

  it(`names the device it was given, on both platforms`, () => {
    for (const platform of ['ios', 'android'] as const) {
      const command = buildScreenshotCommand({
        platform,
        deviceId: 'DEVICE-1',
        filePath: '/a.png',
      });
      expect(command.args).toContain('DEVICE-1');
    }
  });
});

describe(defaultScreenshotPath, () => {
  it(`writes under .expo, which is already gitignored`, () => {
    const filePath = defaultScreenshotPath('/project', new Date('2026-08-24T09:41:02.500Z'));

    expect(filePath).toContain('/project/.expo/exagent/');
    expect(filePath.endsWith('.png')).toBe(true);
    // No colons: they are legal in a path on POSIX and not on Windows, and this is one path.
    expect(filePath.slice('/project/.expo/exagent/'.length)).not.toContain(':');
  });

  it(`never answers the same path twice, so a sweep keeps every picture`, () => {
    expect(defaultScreenshotPath('/p', new Date('2026-08-24T09:41:02.500Z'))).not.toBe(
      defaultScreenshotPath('/p', new Date('2026-08-24T09:41:03.500Z'))
    );
  });
});

/** How the fake device tool behaves for one run. */
type StubTool = {
  exitCode?: number;
  stderr?: string;
  /** Bytes it writes to the descriptor it was handed, i.e. `adb exec-out`. */
  toStdout?: Buffer;
  /** Bytes it writes at the path on its command line, i.e. `simctl`. */
  toFile?: Buffer;
  /** Refuse to start at all, the way a binary that is not on `PATH` does. */
  spawnError?: string;
};

/** The `stdio` array the module handed `spawn`, recorded so the redirect itself is testable. */
let recordedStdio: unknown[] = [];

function mockTool(tool: StubTool): void {
  recordedStdio = [];
  jest.mocked(spawn).mockImplementation(((command: string, args: string[], options: any) => {
    recordedStdio = options.stdio;
    const child = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
    process.nextTick(() => {
      if (tool.spawnError) {
        child.emit('error', new Error(tool.spawnError));
        return;
      }
      // The real `adb exec-out` writes the image to the descriptor it was given; the real
      // `simctl` writes the path on its own command line. Each stub does what its tool does.
      if (tool.toStdout && typeof options.stdio[1] === 'number') {
        fs.writeSync(options.stdio[1], tool.toStdout, 0, tool.toStdout.length);
      }
      if (tool.toFile) {
        fs.writeFileSync(args[args.length - 1]!, tool.toFile);
      }
      if (tool.stderr) {
        child.stderr.emit('data', tool.stderr);
      }
      child.emit('close', tool.exitCode ?? 0, null);
    });
    return child as any;
  }) as any);
}

describe(captureScreenshotAsync, () => {
  beforeEach(() => vol.fromJSON({ '/project/package.json': '{}' }));
  afterEach(() => vol.reset());

  it(`reports the file the iOS tool wrote, and where it is`, async () => {
    mockTool({ toFile: Buffer.concat([PNG_HEADER, Buffer.from('rest')]) });

    const result = await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/.expo/exagent/one.png',
    });

    expect(result).toMatchObject({
      ok: true,
      reason: null,
      path: '/project/.expo/exagent/one.png',
      platform: 'ios',
      deviceId: 'SIM-1',
    });
    expect(result.bytes).toBe(PNG_HEADER.length + 4);
    // simctl is given the path, so nothing is redirected: a descriptor here would be a file the
    // tool never wrote to and a picture nobody took.
    expect(recordedStdio[1]).toBe('ignore');
  });

  // The wiring that decides whether an Android capture is a PNG or an empty file.
  it(`hands the Android tool a descriptor for the file, not a pipe`, async () => {
    mockTool({ toStdout: Buffer.concat([PNG_HEADER, Buffer.from([0x0d, 0x0a, 0x00, 0xff])]) });

    const result = await captureScreenshotAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      filePath: '/project/two.png',
    });

    expect(typeof recordedStdio[1]).toBe('number');
    expect(result).toMatchObject({ ok: true, reason: null, platform: 'android' });
    expect(fs.readFileSync('/project/two.png')).toEqual(
      Buffer.concat([PNG_HEADER, Buffer.from([0x0d, 0x0a, 0x00, 0xff])])
    );
  });

  it(`creates the directory the path names`, async () => {
    mockTool({ toFile: PNG_HEADER });

    await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/.expo/exagent/nested/deep.png',
    });

    expect(fs.existsSync('/project/.expo/exagent/nested/deep.png')).toBe(true);
  });

  // The reason the exit code is not what success is read from: `adb exec-out` answers a device
  // that is not ready by writing a sentence to stdout and exiting 0, which leaves a file that
  // exists, is not empty, and is not a picture.
  it(`refuses a file that is not a PNG, whatever the tool exited with`, async () => {
    mockTool({ toStdout: Buffer.from('error: device offline\n') });

    const result = await captureScreenshotAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      filePath: '/project/three.png',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('is not a PNG');
    expect(result.bytes).toBeGreaterThan(0);
  });

  it(`reports a tool that refused, with the first thing it said`, async () => {
    mockTool({ exitCode: 2, stderr: 'No devices are booted.\nsecond line\n' });

    const result = await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/four.png',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('No devices are booted.');
    expect(result.reason).not.toContain('second line');
    expect(result.command).toContain('xcrun simctl io SIM-1 screenshot');
  });

  it(`reports a tool that is not on this machine, without throwing`, async () => {
    mockTool({ spawnError: 'spawn xcrun ENOENT' });

    const result = await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/five.png',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('could not be run');
    expect(result.reason).toContain('ENOENT');
  });

  it(`reports a tool that exited 0 and wrote nothing`, async () => {
    mockTool({});

    const result = await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/six.png',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('wrote no file');
  });

  // A picture from an earlier run at the same path would otherwise be reported as this run's.
  it(`removes a stale file rather than reporting it as this capture`, async () => {
    vol.fromJSON({ '/project/seven.png': 'old' });
    fs.writeFileSync('/project/seven.png', PNG_HEADER);
    mockTool({ exitCode: 3 });

    const result = await captureScreenshotAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      filePath: '/project/seven.png',
    });

    expect(result.ok).toBe(false);
    expect(fs.existsSync('/project/seven.png')).toBe(false);
  });
});
