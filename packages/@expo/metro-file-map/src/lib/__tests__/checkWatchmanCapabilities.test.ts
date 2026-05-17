/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import checkWatchmanCapabilities from '../checkWatchmanCapabilities';

const mockExecFile = jest.fn();
jest.mock('child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
}));

const mockSuccessResponse = JSON.stringify({
  version: 'v123',
  capabilities: ['c1', 'c2'],
});

function setMockExecFileResponse(err: unknown, stdout?: unknown) {
  mockExecFile.mockImplementation(
    (file: string, _args: string[], cb: (err: unknown, result: unknown) => void) => {
      expect(file).toBe('watchman');
      cb(err, err == null ? { stdout } : null);
    }
  );
}

describe('checkWatchmanCapabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('executes watchman list-capabilities and resolves on success', async () => {
    setMockExecFileResponse(null, mockSuccessResponse);
    await expect(checkWatchmanCapabilities(['c1', 'c2'])).resolves.toEqual({
      version: 'v123',
    });
    expect(mockExecFile).toHaveBeenCalledWith(
      'watchman',
      ['list-capabilities', '--output-encoding=json', '--no-pretty', '--no-spawn'],
      expect.any(Function)
    );
  });

  test('rejects when execFile reports ENOENT', async () => {
    setMockExecFileResponse({ code: 'ENOENT' });
    await expect(checkWatchmanCapabilities([])).rejects.toMatchInlineSnapshot(
      `[Error: Watchman is not installed or not available on PATH]`
    );
    expect(mockExecFile).toHaveBeenCalled();
  });

  test('rejects when execFile fails', async () => {
    setMockExecFileResponse(new Error('execFile error'));
    await expect(checkWatchmanCapabilities([])).rejects.toMatchInlineSnapshot(
      `[Error: execFile error]`
    );
    expect(mockExecFile).toHaveBeenCalled();
  });

  test('rejects when the response is not JSON', async () => {
    setMockExecFileResponse(null, 'not json');
    await expect(checkWatchmanCapabilities([])).rejects.toMatchInlineSnapshot(
      `[Error: Failed to parse response from \`watchman list-capabilities\`]`
    );
    expect(mockExecFile).toHaveBeenCalled();
  });

  test('rejects when we are missing a required capability', async () => {
    setMockExecFileResponse(null, mockSuccessResponse);
    await expect(checkWatchmanCapabilities(['c1', 'other-cap'])).rejects.toMatchInlineSnapshot(
      `[Error: The installed version of Watchman (v123) is missing required capabilities: other-cap]`
    );
    expect(mockExecFile).toHaveBeenCalled();
  });
});
