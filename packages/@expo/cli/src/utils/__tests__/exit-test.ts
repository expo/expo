import { spawn } from 'node:child_process';
import timers from 'node:timers/promises';

import { warn } from '../../log';
import { installExitHooks, ensureProcessExitsAfterDelay } from '../exit';

jest.mock('../../log');

it('attaches and removes process listeners', () => {
  jest.spyOn(process, 'on');
  jest.spyOn(process, 'removeListener');

  const fn = jest.fn();

  expect(process.on).not.toHaveBeenCalled();

  const unsub = installExitHooks(fn);
  const unsub2 = installExitHooks(jest.fn());

  expect(process.on).toHaveBeenCalledTimes(4);
  expect(process.on).toHaveBeenNthCalledWith(1, 'SIGHUP', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(2, 'SIGINT', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(3, 'SIGTERM', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(4, 'SIGBREAK', expect.any(Function));

  expect(process.removeListener).not.toHaveBeenCalled();

  // Unsub the first listener, this won't remove the other listeners.
  unsub();
  expect(process.removeListener).not.toHaveBeenCalled();

  // Unsub the second listener, this will remove the other listeners.
  unsub2();
  expect(process.removeListener).toHaveBeenCalledTimes(4);
});

describe(ensureProcessExitsAfterDelay, () => {
  // This doesn't really fail on itself, but does cause a Jest warning about processes not exiting or crashing
  it('detects the process can exit in its own', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Test if the process is force-exited after 0.2 seconds
    ensureProcessExitsAfterDelay(200);

    // Immediately let it pass
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("force-exits when a ref'd timer is leaked", async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Simulate a library leaking a ref'd timer (e.g. during static rendering).
    // getActiveResourcesInfo() only reports ref'd timers, so this should be
    // detected as a blocking resource and eventually force-exited.
    const leaked = setTimeout(() => {}, 60_000);

    ensureProcessExitsAfterDelay(200);

    // Wait longer than the exit timer
    await timers.setTimeout(1000);

    expect(exitSpy).toHaveBeenCalledWith(0);

    clearTimeout(leaked);
    exitSpy.mockRestore();
  });

  it('detects and logs unexpected active child processes and force exits', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Start a child process with piped stdio so the handles remain visible in getActiveResourcesInfo
    const pending = spawn('sleep', ['60'], { stdio: 'pipe' });
    // Test if the process is force-exited after 0.2 seconds
    ensureProcessExitsAfterDelay(200);

    // Wait longer than the exit timer (1s to account for nextTick delays in polling)
    await timers.setTimeout(1000);

    // Ensure `process.exit` was called
    expect(exitSpy).toHaveBeenCalledWith(0);
    // Ensure a warning was logged about the active process
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/preventing Expo from exiting/));

    exitSpy.mockReset();
    pending.kill();
  });
});
