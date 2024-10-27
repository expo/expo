import { AndroidConfig, type ExportedConfig, IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import matchers from 'expect/build/matchers';
import fs from 'fs';

import { getInfoPlistPathLikePrebuild, getProjectRootLikePrebuild } from './prebuild-tester';

matchers.customTesters = [];

const cacheSymbol = Symbol('jest.prebuild.cache');

expect.extend({
  toMatchInfoPlist(
    config: ExportedConfig & {
      [cacheSymbol]?: {
        infoPlist?: Record<string, any>;
      };
    },
    expected: any
  ) {
    if (config[cacheSymbol]?.infoPlist) {
      return matchers.toEqual(config[cacheSymbol].infoPlist, expected);
    }

    const infoPlistPath = getInfoPlistPathLikePrebuild(config);
    const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));

    config[cacheSymbol] = config[cacheSymbol] || {};
    config[cacheSymbol].infoPlist = config[cacheSymbol].infoPlist || infoPlist;

    return matchers.toEqual(infoPlist, expected);
  },
  toMatchAppleEntitlements(config: ExportedConfig, expected: any) {
    const filePath = IOSConfig.Entitlements.getEntitlementsPath(getProjectRootLikePrebuild(config));
    if (!filePath) throw new Error('iOS entitlements path not found');
    const data = plist.parse(fs.readFileSync(filePath, 'utf8'));
    return matchers.toEqual(data, expected);
  },
  toHaveModHistory(config: ExportedConfig, name: string) {
    if (!config._internal?.pluginHistory) {
      return {
        pass: false,
        message: () => `expected config to have _internal.pluginHistory`,
      };
    }
    if (!config._internal?.pluginHistory[name]) {
      return {
        pass: false,
        message: () =>
          `expected config to have _internal.pluginHistory.${name}. Instead found: ${Object.keys(config._internal!.pluginHistory!)}`,
      };
    }
    return {
      pass: true,
      message: () => '',
    };
  },

  toMatchAndroidProjectBuildGradle(config: ExportedConfig, expected: any) {
    return matchers.toEqual(
      fs.readFileSync(
        AndroidConfig.Paths.getProjectBuildGradleFilePath(getProjectRootLikePrebuild(config)),
        'utf8'
      ),
      expected
    );
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchInfoPlist(data: Record<string, any>): R;
      toMatchAppleEntitlements(data: Record<string, any>): R;
      toHaveModHistory(name: string): R;
      toMatchAndroidProjectBuildGradle(matcher: string | RegExp): R;
    }
  }
}
