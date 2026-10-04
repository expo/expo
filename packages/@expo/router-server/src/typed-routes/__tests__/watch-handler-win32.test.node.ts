import { requireContext } from 'expo-router/internal/testing';

import { getWatchHandler } from '../index';

// Metro reports native paths, so on Windows the watch handler receives backslash-separated paths
jest.mock('node:path', () => jest.requireActual<typeof import('node:path')>('node:path').win32);

const APP_ROOT = 'C:\\repo\\apps\\expo\\src\\app';

describe('getWatchHandler on Windows', () => {
  const originalAppRoot = process.env.EXPO_ROUTER_APP_ROOT;
  const regenerateFn = jest.fn();
  let ctx: ReturnType<typeof requireContext>;
  let handler: ReturnType<typeof getWatchHandler>;

  beforeAll(() => {
    process.env.EXPO_ROUTER_APP_ROOT = APP_ROOT;
  });
  afterAll(() => {
    process.env.EXPO_ROUTER_APP_ROOT = originalAppRoot;
  });

  beforeEach(() => {
    ctx = requireContext('FAKE_INPUT', true, /\.[tj]sx?$/, {
      './index.ts': true,
      './fruit/banana.ts': true,
    });
    handler = getWatchHandler('C:\\repo\\apps\\expo\\.expo\\types', { ctx, regenerateFn });
  });

  it('ignores files outside the app root', () => {
    handler('C:\\repo\\packages\\api\\src\\seed.ts', 'add');
    handler('C:\\repo\\packages\\api\\src\\seed.ts', 'delete');

    expect(ctx.keys()).toEqual(['./index.ts', './fruit/banana.ts']);
    expect(regenerateFn).not.toHaveBeenCalled();
  });

  it('ignores files on another drive', () => {
    handler('D:\\other\\seed.ts', 'add');

    expect(ctx.keys()).toEqual(['./index.ts', './fruit/banana.ts']);
    expect(regenerateFn).not.toHaveBeenCalled();
  });

  it('adds nested files with posix context keys', () => {
    handler(`${APP_ROOT}\\fruit\\apple.ts`, 'add');

    expect(ctx.keys()).toEqual(['./index.ts', './fruit/banana.ts', './fruit/apple.ts']);
    expect(regenerateFn).toHaveBeenCalledTimes(1);
  });

  it('deletes nested files', () => {
    handler(`${APP_ROOT}\\fruit\\banana.ts`, 'delete');

    expect(ctx.keys()).toEqual(['./index.ts']);
    expect(regenerateFn).toHaveBeenCalledTimes(1);
  });
});
