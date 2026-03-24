import { AndroidConfig, type ExportedConfig, IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';

import { getInfoPlistPathLikePrebuild, getProjectRootLikePrebuild } from './prebuild-tester';

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
      const pass = this.equals(config[cacheSymbol].infoPlist, expected);
      return {
        pass,
        message: () =>
          this.utils.matcherHint('toMatchInfoPlist') +
          '\n\n' +
          this.utils.printDiffOrStringify(
            expected,
            config[cacheSymbol]!.infoPlist,
            'Expected',
            'Received',
            this.expand !== false
          ),
      };
    }

    const infoPlistPath = getInfoPlistPathLikePrebuild(config);
    const infoPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));

    config[cacheSymbol] = config[cacheSymbol] || {};
    config[cacheSymbol].infoPlist = config[cacheSymbol].infoPlist || infoPlist;

    const pass = this.equals(infoPlist, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toMatchInfoPlist') +
        '\n\n' +
        this.utils.printDiffOrStringify(expected, infoPlist, 'Expected', 'Received', this.expand !== false),
    };
  },
  toMatchAppleEntitlements(config: ExportedConfig, expected: any) {
    const filePath = IOSConfig.Entitlements.getEntitlementsPath(getProjectRootLikePrebuild(config));
    if (!filePath) throw new Error('iOS entitlements path not found');
    const data = plist.parse(fs.readFileSync(filePath, 'utf8'));
    const pass = this.equals(data, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toMatchAppleEntitlements') +
        '\n\n' +
        this.utils.printDiffOrStringify(expected, data, 'Expected', 'Received', this.expand !== false),
    };
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
    const received = fs.readFileSync(
      AndroidConfig.Paths.getProjectBuildGradleFilePath(getProjectRootLikePrebuild(config)),
      'utf8'
    );
    const pass = this.equals(received, expected);
    return {
      pass,
      message: () =>
        this.utils.matcherHint('toMatchAndroidProjectBuildGradle') +
        '\n\n' +
        this.utils.printDiffOrStringify(expected, received, 'Expected', 'Received', this.expand !== false),
    };
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
