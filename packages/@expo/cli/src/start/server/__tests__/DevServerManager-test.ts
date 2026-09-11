import { getConfig } from '@expo/config';

import type { BundlerStartOptions } from '../BundlerDevServer';
import { DevServerManager } from '../DevServerManager';
import { getPlatformBundlers } from '../platformBundlers';

jest.mock('@expo/config');
jest.mock('../platformBundlers');
jest.mock('../DevToolsPluginManager');

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as jest.MockedFunction<T>;

function createManager(webPort?: number, port?: number) {
  // `isExporting` skips the babel config watcher, which needs a real project on disk.
  const options = { location: {}, isExporting: true, port } as BundlerStartOptions;
  const manager = new DevServerManager('/', options, webPort);
  jest.spyOn(manager, 'startAsync').mockResolvedValue({} as any);
  return manager;
}

beforeEach(() => {
  asMock(getConfig).mockReturnValue({ exp: {} } as any);
  asMock(getPlatformBundlers).mockReturnValue({ web: 'webpack' } as any);
});

describe('ensureWebDevServerRunningAsync', () => {
  it(`starts the web dev server with the port resolved up front`, async () => {
    const manager = createManager(19006);

    await manager.ensureWebDevServerRunningAsync();

    expect(manager.startAsync).toHaveBeenCalledWith([
      { type: 'webpack', options: expect.objectContaining({ port: 19006 }) },
    ]);
  });

  it(`falls back to the start options port when no web port was resolved`, async () => {
    // `expo run:*` builds the manager through `startMetroAsync`, which has no web port.
    const manager = createManager(undefined, 8081);

    await manager.ensureWebDevServerRunningAsync();

    expect(manager.startAsync).toHaveBeenCalledWith([
      { type: 'webpack', options: expect.objectContaining({ port: 8081 }) },
    ]);
  });
});
