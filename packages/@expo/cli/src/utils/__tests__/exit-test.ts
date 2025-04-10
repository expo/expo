import { fork } from 'node:child_process';
import path from 'node:path';
import timers from 'node:timers/promises';

import { warn } from '../../log';
import { installExitHooks, ensureProcessExitsAfterDelay } from '../exit';

jest.mock('../../log');

it('attaches and removes process listeners', () => {
  jest.spyOn(process, 'on');
  jest.spyOn(process, 'removeListener');

  const fn = jest.fn();

  expect(process.on).not.toBeCalled();

  const unsub = installExitHooks(fn);
  const unsub2 = installExitHooks(jest.fn());

  expect(process.on).toHaveBeenCalledTimes(4);
  expect(process.on).toHaveBeenNthCalledWith(1, 'SIGHUP', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(2, 'SIGINT', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(3, 'SIGTERM', expect.any(Function));
  expect(process.on).toHaveBeenNthCalledWith(4, 'SIGBREAK', expect.any(Function));

  expect(process.removeListener).not.toBeCalled();

  // Unsub the first listener, this won't remove the other listeners.
  unsub();
  expect(process.removeListener).not.toBeCalled();

  // Unsub the second listener, this will remove the other listeners.
  unsub2();
  expect(process.removeListener).toBeCalledTimes(4);
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

  it('detects unexpected active resources and force exits', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Test if the process is force-exited after 0.2 seconds
    ensureProcessExitsAfterDelay(200);

    // Wait longer than the exit timer (0.5s)
    await timers.setTimeout(500);

    // Ensure `process.exit` was called
    expect(exitSpy).toHaveBeenCalledWith(0);
    // Ensure a warning was logged
    expect(warn).toHaveBeenCalledWith(
      'Something prevented Expo from exiting, forcefully exiting now.'
    );
  });

  it('detects and logs unexpected active child processes and force exits', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Get the file path to the process that will go on indefinitely
    const processFile = path.join(__dirname, './fixtures/exit-indefinite-process.js');
    // Start a process that will go on indefinitely
    const pending = fork(processFile, { stdio: 'inherit' });
    // Test if the process is force-exited after 0.2 seconds
    ensureProcessExitsAfterDelay(200);

    // Wait longer than the exit timer (0.5s)
    await timers.setTimeout(500);

    // Ensure `process.exit` was called
    expect(exitSpy).toHaveBeenCalledWith(0);
    // Ensure a warning was logged
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(processFile));
    expect(warn).toHaveBeenCalledWith(
      'Detected 1 process preventing Expo from exiting, forcefully exiting now.'
    );

    exitSpy.mockReset();
    pending.kill();
  });
});
