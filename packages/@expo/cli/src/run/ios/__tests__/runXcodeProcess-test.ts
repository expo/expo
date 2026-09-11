import { CompileError } from '@ramonclaudio/compile';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { setTimeout } from 'timers/promises';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import { runXcodeProcessAsync } from '../runXcodeProcess';

jest.unmock('child_process');
jest.unmock('fs');
jest.unmock('os');

const options = { cwd: process.cwd(), env: process.env, signal: undefined };
const itPosix = process.platform === 'win32' ? it.skip : it;

it('captures separate complete stdout and stderr and preserves nonzero exit codes', async () => {
  await expect(
    runXcodeProcessAsync(
      process.execPath,
      [
        '-e',
        `process.stdout.write('build settings');
         process.stderr.write('diagnostics');
         process.exitCode = 7;`,
      ],
      options
    )
  ).resolves.toEqual({
    status: 'exited',
    exitCode: 7,
    stdout: 'build settings',
    stderr: 'diagnostics',
  });
});

it('passes the working directory and environment to the child', async () => {
  const cwd = fs.realpathSync(os.tmpdir());
  await expect(
    runXcodeProcessAsync(
      process.execPath,
      ['-e', 'process.stdout.write(`${process.cwd()}:${process.env.EXPO_PROCESS_TEST}`)'],
      { ...options, cwd, env: { ...process.env, EXPO_PROCESS_TEST: 'metadata' } }
    )
  ).resolves.toEqual({
    status: 'exited',
    exitCode: 0,
    stdout: `${cwd}:metadata`,
    stderr: '',
  });
});

it('wraps startup failures in CompileError', async () => {
  await expect(
    runXcodeProcessAsync(path.join(os.tmpdir(), 'missing-expo-xcode-command'), [], options)
  ).rejects.toMatchObject({
    name: 'CompileError',
    cause: { code: 'ENOENT' },
  });
});

it('does not start an already cancelled command', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    runXcodeProcessAsync('missing-command', [], { ...options, signal: controller.signal })
  ).rejects.toEqual(
    new CompileError('Process was cancelled before starting.', { signal: 'SIGTERM' })
  );
});

itPosix(
  'preserves cancellation and output when the child handles SIGTERM and exits successfully',
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-xcode-abort-'));
    const pidFile = path.join(directory, 'child-pid');
    const controller = new AbortController();
    const result = runXcodeProcessAsync(
      process.execPath,
      [
        '-e',
        `const timer = setTimeout(() => process.exit(9), 5000);
       process.on('SIGTERM', () => { process.stdout.write('stopped'); clearTimeout(timer); });
       require('fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`,
      ],
      { ...options, signal: controller.signal }
    );
    try {
      await waitFor(() => fs.existsSync(pidFile), 'the cancellable child to start');
      controller.abort();
      await expect(result).resolves.toEqual({
        status: 'signaled',
        signal: 'SIGTERM',
        stdout: 'stopped',
        stderr: '',
      });
    } finally {
      controller.abort();
      if (fs.existsSync(pidFile)) stopProcess(Number(fs.readFileSync(pidFile, 'utf8')));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
);

itPosix('preserves the signal when the child is interrupted', async () => {
  await expect(
    runXcodeProcessAsync(
      process.execPath,
      ['-e', "process.stdout.write('settings'); process.kill(process.pid, 'SIGINT');"],
      options
    )
  ).resolves.toEqual({ status: 'signaled', signal: 'SIGINT', stdout: 'settings', stderr: '' });
});

itPosix(
  'stops the metadata child when Expo exits from its first terminal signal listener',
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-xcode-signal-'));
    const pidFile = path.join(directory, 'child-pid');
    const signalFile = path.join(directory, 'child-signal');
    const adapter = transpileModule(
      fs.readFileSync(require.resolve('../runXcodeProcess'), 'utf8'),
      {
        compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
      }
    ).outputText;
    const childScript = `
    const fs = require('fs');
    process.on('SIGINT', () => {
      fs.writeFileSync(${JSON.stringify(signalFile)}, 'SIGINT');
      process.exit(0);
    });
    fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
    setInterval(() => {}, 1000);
  `;
    const parentScript = `
    process.on('SIGINT', () => process.exit(0));
    process.on('SIGTERM', () => process.exit(0));
    ${adapter}
    exports.runXcodeProcessAsync(process.execPath, ['-e', ${JSON.stringify(childScript)}], {
      cwd: ${JSON.stringify(directory)}, env: process.env, signal: undefined
    }).catch(error => { console.error(error); process.exit(1); });
  `;
    const parent = spawn(process.execPath, ['-e', parentScript], {
      cwd: path.resolve(__dirname, '../../../..'),
      detached: true,
      stdio: 'ignore',
    });
    let childPid: number | undefined;
    try {
      await waitFor(() => fs.existsSync(pidFile), 'the metadata child to start');
      childPid = Number(fs.readFileSync(pidFile, 'utf8'));
      const parentPid = parent.pid;
      if (!parentPid) throw new Error('The Expo fixture did not start.');
      process.kill(-parentPid, 'SIGINT');

      await waitFor(
        () => parent.exitCode !== null || parent.signalCode !== null,
        'the Expo fixture to exit'
      );
      const metadataPid = childPid;
      await waitFor(() => !isRunning(metadataPid), 'the metadata child to exit');
      expect(parent.exitCode).toBe(0);
      expect(fs.readFileSync(signalFile, 'utf8')).toBe('SIGINT');
    } finally {
      if (childPid !== undefined) stopProcess(childPid);
      if (parent.pid !== undefined) stopProcess(-parent.pid);
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },
  15_000
);

async function waitFor(predicate: () => boolean, description: string) {
  const deadline = Date.now() + 5_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${description}.`);
    await setTimeout(20);
  }
}

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH') {
      return false;
    }
    throw error;
  }
}

function stopProcess(pid: number) {
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    if (
      !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH')
    ) {
      throw error;
    }
  }
}
