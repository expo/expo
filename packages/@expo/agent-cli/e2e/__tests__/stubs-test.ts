/* eslint-env jest */
// The shared e2e doubles, tested on their own.
//
// Every other e2e file asserts what `@expo/agent-cli` does *given* one of these; if a double is wrong, that
// file fails for a reason that has nothing to do with the command under test. So the doubles get
// their own tests: the stub-bin installer against an arbitrary bin name, and the stub dev server
// against the two requests `@expo/agent-cli` uses to recognize a real one.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { getTemporaryPath, installStubBinAsync, startStubDevServerAsync } from '../utils';

/** Run one of the installed shims the way a command under test spawns a resolved bin. */
async function runBinAsync(
  binDir: string,
  name: string,
  args: string[] = []
): Promise<{ code: number | null; stdout: string }> {
  const command = path.join(binDir, process.platform === 'win32' ? `${name}.cmd` : name);
  const child = spawn(command, args, { shell: process.platform === 'win32' });
  let stdout = '';
  child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
  const code = await new Promise<number | null>((resolve) => child.once('close', resolve));
  return { code, stdout };
}

describe(installStubBinAsync, () => {
  let binDir: string;

  beforeEach(async () => {
    binDir = path.join(getTemporaryPath(), '.stub-bin');
    await fs.promises.mkdir(binDir, { recursive: true });
  });

  it('installs both shims for any bin name', async () => {
    const stubScript = path.join(binDir, 'doctor-stub.js');
    await fs.promises.writeFile(stubScript, `process.stdout.write('doctor ok\\n');\n`);

    await installStubBinAsync(binDir, 'expo-doctor', stubScript);

    // Both spellings always exist: the resolvers under test pick the `.cmd` name on Windows and
    // the bare name everywhere else.
    expect(fs.existsSync(path.join(binDir, 'expo-doctor'))).toBe(true);
    expect(fs.existsSync(path.join(binDir, 'expo-doctor.cmd'))).toBe(true);

    const result = await runBinAsync(binDir, 'expo-doctor');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('doctor ok');
  });

  // A command that waits needs something that never answers to wait for.
  it('installs a stub that stalls until it is killed', async () => {
    const stubScript = path.join(binDir, 'stall-stub.js');
    await fs.promises.writeFile(
      stubScript,
      `process.stdout.write('started\\n');\nsetInterval(() => {}, 1000);\n`
    );
    await installStubBinAsync(binDir, 'stalls', stubScript);

    const command = path.join(binDir, process.platform === 'win32' ? 'stalls.cmd' : 'stalls');
    const child = spawn(command, [], { shell: process.platform === 'win32' });
    const started = await new Promise<string>((resolve) =>
      child.stdout.once('data', (chunk) => resolve(chunk.toString()))
    );

    expect(started).toContain('started');
    expect(child.exitCode).toBeNull();

    child.kill('SIGKILL');
    await new Promise((resolve) => child.once('close', resolve));
  });
});

describe(startStubDevServerAsync, () => {
  it('answers /status the way a running dev server does', async () => {
    const server = await startStubDevServerAsync({ projectRoot: '/tmp/some-app' });
    try {
      const response = await fetch(`${server.url}/status`);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('packager-status:running');
      expect(response.headers.get('x-react-native-project-root')).toBe('/tmp/some-app');
    } finally {
      await server.close();
    }
  });

  it('answers /json/list with the configured targets', async () => {
    const targets = [{ id: '1', title: 'Expo Go', description: 'host.exp.Exponent' }];
    const server = await startStubDevServerAsync({ targets });
    try {
      const response = await fetch(`${server.url}/json/list`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(targets);
    } finally {
      await server.close();
    }
  });

  it('answers no targets by default, and 404s anything else', async () => {
    const server = await startStubDevServerAsync();
    try {
      expect(await (await fetch(`${server.url}/json/list`)).json()).toEqual([]);
      expect((await fetch(`${server.url}/nope`)).status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('holds /status open for the delay it was given', async () => {
    const server = await startStubDevServerAsync({ statusDelayMs: 300 });
    try {
      const startedAt = Date.now();
      const response = await fetch(`${server.url}/status`);
      const elapsed = Date.now() - startedAt;

      expect(response.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(250);
      // The delay is on `/status` alone, so a test can have a server that is up but not ready.
      expect((await fetch(`${server.url}/json/list`)).status).toBe(200);
    } finally {
      await server.close();
    }
  });

  // The inspector socket has three modes and they are three different runtimes, so the one that
  // decides an exit code is worth checking on its own. `no-debugger` is a socket that is open and
  // answers `-32601` to everything, which is what `runtime:errors --fail-on-error` reads as "this
  // window observed nothing" and exits 22 for.
  it('answers every debugger method -32601 in the no-debugger mode', async () => {
    const server = await startStubDevServerAsync({ inspectorSocket: 'no-debugger' });
    try {
      const socket = new WebSocket(`ws://127.0.0.1:${server.port}/inspector/debug?page=1`);
      const answer = await new Promise<any>((resolve, reject) => {
        socket.addEventListener('error', reject);
        socket.addEventListener('open', () =>
          socket.send(JSON.stringify({ id: 7, method: 'Runtime.evaluate', params: {} }))
        );
        socket.addEventListener('message', (event) => resolve(JSON.parse(String(event.data))));
      });
      socket.close();

      expect(answer).toEqual({ id: 7, error: { code: -32601, message: 'Method not found' } });
    } finally {
      await server.close();
    }
  });

  // The default is the other runtime: a socket that accepts the connection and says nothing, which
  // is a connected app that is being asked nothing.
  it('accepts the connection and answers nothing in the live mode', async () => {
    const server = await startStubDevServerAsync();
    try {
      const socket = new WebSocket(`ws://127.0.0.1:${server.port}/inspector/debug?page=1`);
      const answered = await new Promise<boolean>((resolve, reject) => {
        socket.addEventListener('error', reject);
        socket.addEventListener('open', () => {
          socket.send(JSON.stringify({ id: 7, method: 'Runtime.evaluate', params: {} }));
          setTimeout(() => resolve(false), 300);
        });
        socket.addEventListener('message', () => resolve(true));
      });
      socket.close();

      expect(answered).toBe(false);
    } finally {
      await server.close();
    }
  });

  it('listens on its own port, and stops answering once closed', async () => {
    const first = await startStubDevServerAsync();
    const second = await startStubDevServerAsync();

    expect(first.port).not.toBe(second.port);
    expect(first.url).toBe(`http://127.0.0.1:${first.port}`);

    await first.close();
    await second.close();
    await expect(fetch(`${first.url}/status`)).rejects.toThrow();
  });
});
