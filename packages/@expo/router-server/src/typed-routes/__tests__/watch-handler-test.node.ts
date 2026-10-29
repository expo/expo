import { requireContext } from 'expo-router/internal/testing';
import path from 'node:path';

import { getWatchHandler } from '../index';

describe('typed route watch events on Windows', () => {
  const originalAppRoot = process.env.EXPO_ROUTER_APP_ROOT;

  beforeEach(() => {
    process.env.EXPO_ROUTER_APP_ROOT = 'C:\\project\\src\\app';
    jest.spyOn(path, 'relative').mockImplementation(path.win32.relative);
    jest.spyOn(path, 'basename').mockImplementation(path.win32.basename);
    jest.spyOn(path, 'isAbsolute').mockImplementation(path.win32.isAbsolute);
    jest.replaceProperty(path, 'sep', '\\');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalAppRoot === undefined) delete process.env.EXPO_ROUTER_APP_ROOT;
    else process.env.EXPO_ROUTER_APP_ROOT = originalAppRoot;
  });

  it.each([
    'C:\\project\\src\\components\\extra-card.tsx',
    'C:\\project\\src\\app-other\\index.tsx',
    'D:\\project\\src\\app\\index.tsx',
    'C:\\project\\src\\app',
    'C:\\project\\src',
  ])('ignores an added path outside the app files: %s', async (filePath) => {
    const ctx = requireContext('FAKE_INPUT', true, /\.[tj]sx?$/, { './index.tsx': true });
    const regenerateFn = jest.fn();
    const handler = getWatchHandler('FAKE_OUTPUT', { ctx, regenerateFn });

    await handler(filePath, 'add');

    expect(ctx.keys()).toEqual(['./index.tsx']);
    expect(regenerateFn).not.toHaveBeenCalled();

    await handler('C:\\project\\src\\app\\screen.tsx', 'add');
    expect(ctx.keys()).toEqual(['./index.tsx', './screen.tsx']);
    expect(regenerateFn).toHaveBeenCalledTimes(1);

    await handler('C:\\project\\src\\app\\screen.tsx', 'change');
    expect(regenerateFn).toHaveBeenCalledTimes(2);

    await handler('C:\\project\\src\\app\\screen.tsx', 'delete');
    expect(ctx.keys()).toEqual(['./index.tsx']);
    expect(regenerateFn).toHaveBeenCalledTimes(3);

    await handler('C:\\project\\src\\app\\..notes.tsx', 'add');
    expect(ctx.keys()).toEqual(['./index.tsx', './..notes.tsx']);
    expect(regenerateFn).toHaveBeenCalledTimes(4);
  });
});
