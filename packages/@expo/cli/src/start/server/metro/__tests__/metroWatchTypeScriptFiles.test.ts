import { ServerLike } from '../../BundlerDevServer';
import { metroWatchTypeScriptFiles } from '../metroWatchTypeScriptFiles';

function createRunner() {
  const listeners = new Map();
  const watcher = {
    addListener: jest.fn((event, listener) => {
      listeners.set(event, listener);
    }),
    removeListener: jest.fn(),
  };

  return {
    watcher,
    listeners,
    invoke(events: unknown) {
      listeners.get('change')({ eventsQueue: events });
    },
    runner: {
      metro: {
        getBundler: () => ({
          getBundler: () => ({
            getWatcher: () => watcher,
          }),
        }),
      },
      server: {
        addListener: jest.fn(),
      },
    } as any as {
      metro: import('metro').Server;
      server: ServerLike;
    },
  };
}

describe(metroWatchTypeScriptFiles, () => {
  it(`invokes the callback for every event`, () => {
    const { watcher, runner, invoke } = createRunner();
    const callback = jest.fn();
    metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, ...runner });
    expect(watcher.addListener).toBeCalledWith('change', expect.any(Function));

    invoke([
      {
        filePath: '/foo.ts',
        metadata: {
          type: 'f',
        },
        type: 'add',
      },
      {
        filePath: '/bar.ts',
        metadata: {
          type: 'f',
        },
        type: 'add',
      },
    ]);

    expect(callback).toBeCalledTimes(2);
  });

  for (const filePath of ['/foo.ts', '/bar/foo.tsx', '/app/tsconfig.json']) {
    it(`invokes the callback only when when throttle is set: (${filePath})`, () => {
      const { watcher, runner, invoke } = createRunner();
      const callback = jest.fn();
      metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, throttle: true, ...runner });
      expect(watcher.addListener).toBeCalledWith('change', expect.any(Function));

      invoke([
        {
          filePath,
          metadata: {
            type: 'f',
          },
          type: 'add',
        },
        {
          filePath: '/foo.ts',
          metadata: {
            type: 'f',
          },
          type: 'add',
        },
      ]);

      expect(callback).toBeCalledTimes(1);
    });
  }

  for (const filePath of [
    '/foo.js',
    '/bar/foo.jsx',
    '/node_modules/foo.tsx',
    '/app/node_modules/bar/index.ts',
    '/app/declaration.d.ts',
    'tsconfig.json',
    '/app/bar/tsconfig.json',
  ]) {
    it(`skips non conforming files: (${filePath})`, () => {
      const { watcher, runner, invoke } = createRunner();
      const callback = jest.fn();
      metroWatchTypeScriptFiles({ projectRoot: '/app/', callback, ...runner });
      expect(watcher.addListener).toBeCalledWith('change', expect.any(Function));

      invoke([
        {
          filePath,
          metadata: {
            type: 'f',
          },
          type: 'add',
        },
      ]);

      expect(callback).toBeCalledTimes(0);
    });
  }

  it(`can accept eventTypes`, () => {
    const { watcher, runner, invoke } = createRunner();
    const callback = jest.fn();
    metroWatchTypeScriptFiles({
      projectRoot: '/app/',
      callback,
      ...runner,
      eventTypes: ['delete'],
    });
    expect(watcher.addListener).toBeCalledWith('change', expect.any(Function));

    invoke([
      {
        filePath: 'foo.tsx',
        metadata: {
          type: 'f',
        },
        type: 'delete',
      },
      {
        filePath: 'foo2.tsx',
        metadata: {
          type: 'f',
        },
        type: 'add',
      },
    ]);

    // Only called once
    expect(callback).toBeCalledTimes(1);
  });
});
