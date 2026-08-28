import { exportEmbedBundleAndAssetsAsync } from '../exportEmbedAsync';
import { exportDomComponentAsync } from '../../exportDomComponents';
import type { Options } from '../resolveOptions';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({ exp: { name: 'test', slug: 'test' }, pkg: {} })),
}));

jest.mock('../../exportHermes', () => ({
  isEnableHermesManaged: jest.fn(() => true),
}));

jest.mock('../../exportDomComponents', () => ({
  exportDomComponentAsync: jest.fn(async () => ({
    bundle: { artifacts: [], assets: [] },
    htmlOutputName: 'www.bundle/dom.html',
  })),
}));

jest.mock('../../../start/server/metro/MetroBundlerDevServer', () => {
  class MetroBundlerDevServer {
    isReactServerComponentsEnabled = false;
    nativeExportBundleAsync = jest.fn(async () => ({
      artifacts: [
        {
          filename: 'index.android.bundle',
          originFilename: 'index.js',
          type: 'js',
          source: '',
          metadata: { expoDomComponentReferences: ['/app/components/dom.tsx'] },
        },
      ],
      assets: [],
    }));
  }
  return { MetroBundlerDevServer };
});

jest.mock('../../../start/server/DevServerManager', () => {
  const {
    MetroBundlerDevServer,
  } = require('../../../start/server/metro/MetroBundlerDevServer');
  return {
    DevServerManager: {
      startMetroAsync: jest.fn(async () => ({
        getDefaultDevServer: () => new MetroBundlerDevServer(),
        stopAsync: jest.fn(),
      })),
    },
  };
});

function createOptions(overrides: Partial<Options>): Options {
  return {
    platform: 'android',
    dev: false,
    entryFile: '/app/index.js',
    bundleOutput: '/app/android/build/index.android.bundle',
    minify: false,
    bytecode: false,
    resetCache: false,
    ...overrides,
  } as Options;
}

it('does not emit DOM component source maps when the native bundle requests a source map', async () => {
  await exportEmbedBundleAndAssetsAsync(
    '/app',
    createOptions({ sourcemapOutput: '/app/android/build/index.android.bundle.packager.map' })
  );

  expect(exportDomComponentAsync).toHaveBeenCalledTimes(1);
  expect(exportDomComponentAsync).toHaveBeenCalledWith(
    expect.objectContaining({ includeSourceMaps: false })
  );
});
