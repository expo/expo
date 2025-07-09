import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { assembleAsync, installAsync } from '../../../start/platforms/android/gradle';
import { resolveOptionsAsync } from '../resolveOptions';
import { runAndroidAsync } from '../runAndroidAsync';

jest.mock('../../../log');

jest.mock('../../../utils/port');

jest.mock('../../../start/platforms/android/gradle', () => ({
  assembleAsync: jest.fn(async () => {}),
  installAsync: jest.fn(async () => {}),
}));

jest.mock('../resolveDevice', () => ({
  resolveDeviceAsync: jest.fn(async () => ({
    device: {
      name: 'mock',
      pid: '123',
    },
  })),
}));

jest.mock('../../../utils/env', () => ({
  env: {
    CI: false,
  },
}));

jest.mock('../../startBundler', () => ({
  startBundlerAsync: jest.fn(() => ({
    startAsync: jest.fn(),
    getDefaultDevServer: jest.fn(() => ({
      openCustomRuntimeAsync: jest.fn(),
    })),
  })),
}));

describe(resolveOptionsAsync, () => {
  afterEach(() => vol.reset());

  it(`runs android`, async () => {
    vol.fromJSON(
      {
        ...rnFixture,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({
          version: '53.0.0',
        }),
      },
      '/'
    );

    await runAndroidAsync('/', {});

    expect(assembleAsync).toHaveBeenCalledWith('/android', {
      appName: 'app',
      buildCache: false,
      port: 8081,
      variant: 'debug',
      architectures: '',
    });

    expect(installAsync).toHaveBeenCalledWith('/android', {
      appName: 'app',
      port: 8081,
      variant: 'debug',
    });
  });
});
