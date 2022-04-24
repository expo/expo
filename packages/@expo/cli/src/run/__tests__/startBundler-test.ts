import { vol } from 'memfs';

import { startInterfaceAsync } from '../../start/interface/startInterface';
import { startBundlerAsync } from '../startBundler';

jest.mock('../../start/server/DevServerManager', () => ({
  DevServerManager: jest.fn(() => ({
    startAsync: jest.fn(),
    getDefaultDevServer: jest.fn(),
  })),
}));

jest.mock('../../utils/env', () => ({
  env: {
    CI: false,
  },
}));

jest.mock('../../start/interface/startInterface', () => ({
  startInterfaceAsync: jest.fn(),
}));

describe(startBundlerAsync, () => {
  afterEach(() => vol.reset());

  it(`starts in headless mode`, async () => {
    const manager = await startBundlerAsync('/', {
      headless: true,
      platforms: ['android'],
      port: 3000,
    });

    expect(manager.startAsync).toHaveBeenCalledWith([
      {
        options: {
          devClient: true,
          headless: true,
          location: {},
          port: 3000,
        },
        type: 'metro',
      },
    ]);
    expect(manager.getDefaultDevServer).toBeCalled();
  });

  it(`starts a server`, async () => {
    const manager = await startBundlerAsync('/', {
      headless: false,
      platforms: ['ios'],
      port: 3000,
    });

    expect(manager.startAsync).toHaveBeenCalledWith([
      {
        options: {
          devClient: true,
          headless: false,
          location: {},
          port: 3000,
        },
        type: 'metro',
      },
    ]);
    expect(startInterfaceAsync).toBeCalled();
    expect(manager.getDefaultDevServer).not.toBeCalled();
  });
});
