import { getBareExtensions } from '@expo/config/paths';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { createFastResolver } from '../createExpoMetroResolver';

type SupportedContext = Parameters<ReturnType<typeof createFastResolver>>[0];

const createContext = ({
  platform,
  isServer,
  origin,
}: {
  origin: string;
  platform: string;
  isServer?: boolean;
}): SupportedContext => {
  const preferNativePlatform = platform === 'ios' || platform === 'android';
  const sourceExtsConfig = { isTS: true, isReact: true, isModern: true };
  const sourceExts = getBareExtensions([], sourceExtsConfig);

  return {
    resolveAsset: jest.fn(() => ['asset-path']),
    customResolverOptions: Object.create({
      environment: isServer ? 'node' : 'client',
    }),
    getPackage(packageJsonPath) {
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    },
    mainFields: preferNativePlatform
      ? ['react-native', 'browser', 'main']
      : isServer
      ? ['module', 'main']
      : ['browser', 'module', 'main'],
    nodeModulesPaths: ['node_modules'],
    originModulePath: origin,
    preferNativePlatform,
    sourceExts,
    unstable_enablePackageExports: false,
  };
};

// This test runs on the actual fs.
jest.unmock('fs');

const originProjectRoot = path.join(
  __dirname,
  '../../../../../../../../apps/native-component-list'
);

function resolveTo(
  moduleId: string,
  { platform, isServer, from = 'index.js' }: { platform: string; isServer?: boolean; from?: string }
) {
  const resolver = createFastResolver({ preserveSymlinks: false });
  const context = createContext({
    platform,
    isServer,
    origin: path.join(originProjectRoot, from),
  });
  const res = resolver(context, moduleId, platform);

  expect(res.type).toBe('sourceFile');
  return res.type === 'sourceFile' ? res.filePath : null;
}

describe(createFastResolver, () => {
  describe('ios', () => {
    const platform = 'ios';

    it('asserts not found module', () => {
      expect(() => resolveTo('react-native-fake-lib', { platform })).toThrowError(
        /The module could not be resolved because no file or module matched the pattern:/
      );
    });

    it('resolves ios file module', () => {
      expect(resolveTo('react-native', { platform })).toEqual(
        expect.stringMatching(/\/node_modules\/react-native\/index\.js$/)
      );
      expect(resolveTo('./App', { platform })).toEqual(
        expect.stringMatching(/\/native-component-list\/App.tsx$/)
      );
    });

    it('resolves module with browser shims', () => {
      const resolver = createFastResolver({ preserveSymlinks: false });
      const context = createContext({
        platform,
        origin: path.join(originProjectRoot, 'index.js'),
      });
      const results = resolver(context, 'object-inspect', platform);
      expect(results).toEqual({
        filePath: expect.stringMatching(/\/object-inspect\/index.js$/),
        type: 'sourceFile',
      });

      assert(results.type === 'sourceFile');

      // Browser shims are applied on native.
      expect(
        resolver(
          createContext({
            platform,
            origin: results.filePath,
          }),
          './util.inspect.js',
          platform
        )
      ).toEqual({
        type: 'empty',
      });

      // Browser shims are not applied in server contexts.
      expect(
        resolver(
          createContext({
            platform,
            isServer: true,
            origin: results.filePath,
          }),
          './util.inspect.js',
          platform
        )
      ).toEqual({
        filePath: expect.stringMatching(/object-inspect\/util\.inspect\.js$/),
        type: 'sourceFile',
      });
    });
    it('resolves module with browser shims with non-matching extensions', () => {
      const resolver = createFastResolver({ preserveSymlinks: false });
      const context = createContext({
        platform,
        origin: path.join(originProjectRoot, 'index.js'),
      });
      const results = resolver(context, 'uuid/v4', platform);
      expect(results).toEqual({
        filePath: expect.stringMatching(/\/uuid\/v4.js$/),
        type: 'sourceFile',
      });

      assert(results.type === 'sourceFile');

      // Browser shims are applied on native.
      expect(
        resolver(
          createContext({
            platform,
            origin: results.filePath,
          }),
          './lib/rng',
          platform
        )
      ).toEqual({
        filePath: expect.stringMatching(/node_modules\/uuid\/lib\/rng-browser\.js/),
        type: 'sourceFile',
      });
    });
    it('resolves an asset', () => {
      const resolver = createFastResolver({ preserveSymlinks: false });
      const context = createContext({
        platform,
        origin: path.join(originProjectRoot, 'index.js'),
      });
      const results = resolver(context, './assets/icons/icon.png', platform);
      expect(results).toEqual({
        filePaths: ['asset-path'],
        type: 'assetFiles',
      });
      expect(context.resolveAsset).toBeCalledWith(
        expect.stringMatching(/\/native-component-list\/assets\/icons$/),
        'icon',
        '.png'
      );
    });
  });
});
