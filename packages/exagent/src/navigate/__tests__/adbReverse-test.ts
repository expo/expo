import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { buildReverseCommand, loopbackPortOfUrl, reverseLoopbackPortAsync } from '../adbReverse';

/** Answer every `spawn` call with the queued stdout and exit code. */
function mockSpawnQueue(answers: { stdout?: string; stderr?: string; exitCode?: number | null }[]) {
  const calls: { command: string; args: string[] }[] = [];
  let call = 0;
  jest.mocked(spawn).mockImplementation(((command: string, args: string[]) => {
    calls.push({ command, args });
    const answer = answers[call++] ?? {};
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (answer.stdout) {
        child.stdout.emit('data', answer.stdout);
      }
      if (answer.stderr) {
        child.stderr.emit('data', answer.stderr);
      }
      child.emit('close', answer.exitCode ?? 0, null);
    });
    return child as any;
  }) as any);
  return calls;
}

const ADB = { bin: '/sdk/platform-tools/adb', source: 'ANDROID_HOME', searched: [], fromPathOnly: false } as const;

describe(loopbackPortOfUrl, () => {
  it.each([
    ['exp://127.0.0.1:8250/--/?', 8250],
    ['exp://localhost:8081/--/notes', 8081],
    ['exp://[::1]:8250/--/', 8250],
    ['http://127.0.0.1:8081', 8081],
  ])('reads the port out of %s', (url, port) => {
    expect(loopbackPortOfUrl(url)).toBe(port);
  });

  it.each([
    // A dev server on the LAN is reachable from the device on its own; reversing would point the
    // device at itself instead.
    ['exp://192.168.1.5:8081/--/'],
    ['https://tunnel.example.dev/--/'],
    // A development build's own scheme carries no dev server at all.
    ['myapp://profile/42'],
    // A loopback host with no port names nothing to reverse.
    ['exp://127.0.0.1/--/'],
  ])('answers null for %s', (url) => {
    expect(loopbackPortOfUrl(url)).toBeNull();
  });

  it('answers null for something that is not a URL', () => {
    expect(loopbackPortOfUrl('not a url')).toBeNull();
  });
});

describe(buildReverseCommand, () => {
  it('is the same argv @expo/cli sends', () => {
    expect(buildReverseCommand(ADB, 'emulator-5554', 8250)).toEqual({
      bin: '/sdk/platform-tools/adb',
      args: ['-s', 'emulator-5554', 'reverse', 'tcp:8250', 'tcp:8250'],
      display: '/sdk/platform-tools/adb -s emulator-5554 reverse tcp:8250 tcp:8250',
    });
  });
});

describe(reverseLoopbackPortAsync, () => {
  it('does nothing for a URL that names no loopback port', async () => {
    const calls = mockSpawnQueue([]);
    const result = await reverseLoopbackPortAsync({
      adb: ADB,
      deviceId: 'emulator-5554',
      url: 'myapp://profile/42',
    });

    expect(result).toMatchObject({ ran: false, port: null, ok: null });
    expect(calls).toHaveLength(0);
  });

  it('reverses the port and reports the command that did it', async () => {
    const calls = mockSpawnQueue([{ stdout: '8250\n' }]);
    const result = await reverseLoopbackPortAsync({
      adb: ADB,
      deviceId: 'emulator-5554',
      url: 'exp://127.0.0.1:8250/--/?',
    });

    expect(result).toMatchObject({ ran: true, ok: true, port: 8250, reason: null });
    expect(calls[0]!.args).toEqual(['-s', 'emulator-5554', 'reverse', 'tcp:8250', 'tcp:8250']);
  });

  it('reports a refusal without throwing, because the link is still worth trying', async () => {
    mockSpawnQueue([{ exitCode: 1, stderr: 'error: closed\n' }]);
    const result = await reverseLoopbackPortAsync({
      adb: ADB,
      deviceId: 'emulator-5554',
      url: 'exp://127.0.0.1:8250/--/?',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('error: closed');
  });
});
