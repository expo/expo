import type { JSONObject, JSONValue } from '@expo/json-file';
import JsonFile from '@expo/json-file';
import plist from '@expo/plist';
import assert from 'assert';
import fs, { promises } from 'fs';
import path from 'path';
import type { XcodeProject } from 'xcode';
import xcode from 'xcode';

import type {
  ConfigPlugin,
  ExportedConfig,
  ExportedConfigWithProps,
  ModConfig,
} from '../Plugin.types';
import { Entitlements, Paths } from '../ios';
import { ensureApplicationTargetEntitlementsFileConfigured } from '../ios/Entitlements';
import type { InfoPlist } from '../ios/IosConfig.types';
import { getPbxproj } from '../ios/utils/Xcodeproj';
import { getInfoPlistPathFromPbxproj } from '../ios/utils/getInfoPlistPath';
import { fileExists } from '../utils/modules';
import { sortObject } from '../utils/sortObject';
import { addWarningIOS } from '../utils/warnings';
import type { ForwardedBaseModOptions } from './createBaseMod';
import { provider, withGeneratedBaseMods } from './createBaseMod';
import { withBaseMod } from './withMod';

const { readFile, writeFile } = promises;

type IosModName = keyof Required<ModConfig>['ios'];

function getEntitlementsPlistTemplate() {
  // TODO: Fetch the versioned template file if possible
  return {};
}

function getInfoPlistTemplate() {
  // TODO: Fetch the versioned template file if possible
  return {
    CFBundleDevelopmentRegion: '$(DEVELOPMENT_LANGUAGE)',
    CFBundleExecutable: '$(EXECUTABLE_NAME)',
    CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
    CFBundleName: '$(PRODUCT_NAME)',
    CFBundlePackageType: '$(PRODUCT_BUNDLE_PACKAGE_TYPE)',
    CFBundleInfoDictionaryVersion: '6.0',
    CFBundleSignature: '????',
    LSMinimumSystemVersion: '12.0',
    LSRequiresIPhoneOS: true,
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true,
      NSExceptionDomains: {
        localhost: {
          NSExceptionAllowsInsecureHTTPLoads: true,
        },
      },
    },
    UILaunchStoryboardName: 'SplashScreen',
    UIRequiredDeviceCapabilities: ['armv7'],
    UIViewControllerBasedStatusBarAppearance: false,
    UIStatusBarStyle: 'UIStatusBarStyleDefault',
    CADisableMinimumFrameDurationOnPhone: true,
  };
}

const defaultProviders = {
  dangerous: provider<unknown>({
    getFilePath() {
      return '';
    },
    async read() {
      return {};
    },
    async write() {},
  }),
  finalized: provider<unknown>({
    getFilePath() {
      return '';
    },
    async read() {
      return {};
    },
    async write() {},
  }),
  // Append a rule to supply AppDelegate data to mods on `mods.ios.appDelegate`
  appDelegate: provider<Paths.AppDelegateProjectFile>({
    getFilePath({ modRequest: { projectRoot } }) {
      // TODO: Get application AppDelegate file from pbxproj.
      return Paths.getAppDelegateFilePath(projectRoot);
    },
    async read(filePath) {
      return Paths.getFileInfo(filePath);
    },
    async write(filePath: string, { modResults: { contents } }) {
      await writeFile(filePath, contents);
    },
  }),
  // Append a rule to supply Expo.plist data to mods on `mods.ios.expoPlist`
  expoPlist: provider<JSONObject>({
    isIntrospective: true,
    getFilePath({ modRequest: { projectRoot, introspect } }) {
      try {
        // Derive the platform dir from the source root (`{ios,tvos}/<name>`)
        // rather than hardcoding `ios/`, so tvos-only projects resolve too.
        return path.resolve(Paths.getSupportingPath(projectRoot), 'Expo.plist');
      } catch (error) {
        if (introspect) {
          // No AppDelegate is expected in introspect mode (no native project);
          // mirror the infoPlist provider and fall back to an empty path.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, { modRequest: { introspect } }) {
      try {
        return plist.parse(await readFile(filePath, 'utf8'));
      } catch (error) {
        if (introspect) {
          return {};
        }
        throw error;
      }
    },
    async write(filePath, { modResults, modRequest: { introspect } }) {
      if (introspect) {
        return;
      }
      await writeFile(filePath, plist.build(sortObject(modResults)));
    },
  }),
  // Note: `mods.ios.xcodeproj` is registered separately via
  // `withIosXcodeProjectIteratingBaseMod` so it can iterate over every
  // discovered pbxproj (e.g. both `ios/` and `tvos/`) rather than only the
  // first one returned by `getPBXProjectPath`. The xcodeproj mod isn't a
  // standard single-file provider, so it doesn't fit the createBaseMod
  // contract.
  // Append a rule to supply Info.plist data to mods on `mods.ios.infoPlist`
  infoPlist: provider<InfoPlist, ForwardedBaseModOptions>({
    isIntrospective: true,
    async getFilePath(config) {
      let project: xcode.XcodeProject | null = null;
      try {
        project = getPbxproj(config.modRequest.projectRoot);
      } catch {
        // noop
      }

      // Only check / warn if a project actually exists, this'll provide
      // more accurate warning messages for users in managed projects.
      if (project) {
        const infoPlistBuildProperty = getInfoPlistPathFromPbxproj(project);

        if (infoPlistBuildProperty) {
          //: [root]/myapp/{ios,tvos}/MyApp/Info.plist
          // Derive the platform dir from the source root rather than
          // hardcoding `ios/`, so tvos-only projects resolve too.
          const sourceRoot = Paths.getSourceRoot(config.modRequest.projectRoot);
          const infoPlistPath = path.join(
            //: <projectRoot>/{ios,tvos}
            path.dirname(sourceRoot),
            //: MyApp/Info.plist
            infoPlistBuildProperty
          );
          if (fileExists(infoPlistPath)) {
            return infoPlistPath;
          }
          addWarningIOS(
            'mods.ios.infoPlist',
            `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`
          );
        } else {
          addWarningIOS('mods.ios.infoPlist', 'Failed to find Info.plist linked to Xcode project.');
        }
      }
      try {
        // Fallback on glob...
        return await Paths.getInfoPlistPath(config.modRequest.projectRoot);
      } catch (error: any) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, config) {
      // Apply all of the Info.plist values to the expo.ios.infoPlist object
      // TODO: Remove this in favor of just overwriting the Info.plist with the Expo object. This will enable people to actually remove values.
      if (!config.ios) config.ios = {};
      if (!config.ios.infoPlist) config.ios.infoPlist = {};

      let modResults: InfoPlist;
      try {
        const contents = await readFile(filePath, 'utf8');
        assert(contents, 'Info.plist is empty');
        modResults = plist.parse(contents) as InfoPlist;
      } catch (error: any) {
        // Throw errors in introspection mode.
        if (!config.modRequest.introspect) {
          throw error;
        }
        // Fallback to using the infoPlist object from the Expo config.
        modResults = getInfoPlistTemplate();
      }

      config.ios.infoPlist = {
        ...(modResults || {}),
        ...config.ios.infoPlist,
      };

      return config.ios.infoPlist!;
    },
    async write(filePath, config) {
      // Update the contents of the static infoPlist object
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.infoPlist = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }

      await writeFile(filePath, plist.build(sortObject(config.modResults)));
    },
  }),
  // Append a rule to supply .entitlements data to mods on `mods.ios.entitlements`
  entitlements: provider<JSONObject, ForwardedBaseModOptions>({
    isIntrospective: true,

    async getFilePath(config) {
      try {
        ensureApplicationTargetEntitlementsFileConfigured(config.modRequest.projectRoot);
        return Entitlements.getEntitlementsPath(config.modRequest.projectRoot) ?? '';
      } catch (error: any) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },

    async read(filePath, config) {
      let modResults: JSONObject;
      try {
        if (!config.modRequest.ignoreExistingNativeFiles && fs.existsSync(filePath)) {
          const contents = await readFile(filePath, 'utf8');
          assert(contents, 'Entitlements plist is empty');
          modResults = plist.parse(contents);
        } else {
          modResults = getEntitlementsPlistTemplate();
        }
      } catch (error: any) {
        // Throw errors in introspection mode.
        if (!config.modRequest.introspect) {
          throw error;
        }
        // Fallback to using the template file.
        modResults = getEntitlementsPlistTemplate();
      }

      // Apply all of the .entitlements values to the expo.ios.entitlements object
      // TODO: Remove this in favor of just overwriting the .entitlements with the Expo object. This will enable people to actually remove values.
      if (!config.ios) config.ios = {};
      if (!config.ios.entitlements) config.ios.entitlements = {};

      config.ios.entitlements = {
        ...(modResults || {}),
        ...config.ios.entitlements,
      };

      return config.ios.entitlements!;
    },

    async write(filePath, config) {
      // Update the contents of the static entitlements object
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.entitlements = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }

      await writeFile(filePath, plist.build(sortObject(config.modResults)));
    },
  }),

  podfile: provider<Paths.PodfileProjectFile>({
    getFilePath({ modRequest: { projectRoot } }) {
      return Paths.getPodfilePath(projectRoot);
    },
    // @ts-expect-error
    async read(filePath) {
      // Note(cedric): this file is ruby, which is a 1-value subset of AppleLanguage and fails the type check
      return Paths.getFileInfo(filePath);
    },
    async write(filePath, { modResults: { contents } }) {
      await writeFile(filePath, contents);
    },
  }),

  // Append a rule to supply Podfile.properties.json data to mods on `mods.ios.podfileProperties`
  podfileProperties: provider<Record<string, JSONValue>>({
    isIntrospective: true,

    getFilePath({ modRequest: { projectRoot, introspect } }) {
      try {
        // Sibling of the Podfile, which getPodfilePath resolves against
        // `{ios,tvos}/` so tvos-only projects work too.
        return path.resolve(
          path.dirname(Paths.getPodfilePath(projectRoot)),
          'Podfile.properties.json'
        );
      } catch (error) {
        if (introspect) {
          // No Podfile is expected in introspect mode (no native project).
          return '';
        }
        throw error;
      }
    },
    async read(filePath) {
      let results: Record<string, JSONValue> = {};
      try {
        results = await JsonFile.readAsync(filePath);
      } catch {}
      return results;
    },
    async write(filePath, { modResults, modRequest: { introspect } }) {
      if (introspect) {
        return;
      }
      await JsonFile.writeAsync(filePath, modResults);
    },
  }),
};

type IosDefaultProviders = typeof defaultProviders;

export function withIosBaseMods(
  config: ExportedConfig,
  {
    providers,
    ...props
  }: ForwardedBaseModOptions & { providers?: Partial<IosDefaultProviders> } = {}
): ExportedConfig {
  config = withGeneratedBaseMods<IosModName>(config, {
    ...props,
    platform: 'ios',
    providers: providers ?? getIosModFileProviders(),
  });
  return withIosXcodeProjectIteratingBaseMod(config);
}

export function getIosModFileProviders() {
  return defaultProviders;
}

/**
 * A custom base mod for `mods.ios.xcodeproj`. Unlike the standard providers,
 * this one runs the chained `xcodeproj` mod action once per discovered
 * pbxproj — typically `ios/HelloWorld.xcodeproj/project.pbxproj` AND
 * `tvos/HelloWorld.xcodeproj/project.pbxproj` when both directories exist.
 *
 * `Paths.getAllPBXProjectPaths` is scoped to `{ios,tvos}/**`, so macOS Xcode
 * projects are intentionally excluded — leaf mods like `withBundleIdentifier`
 * should not touch a macos pbxproj. Existing leaf mods (registered via
 * `withXcodeProject`) work unchanged: they see a single `XcodeProject` in
 * `modResults` each time the action fires.
 */
const withIosXcodeProjectIteratingBaseMod: ConfigPlugin = (config) => {
  return withBaseMod<XcodeProject>(config, {
    platform: 'ios',
    mod: 'xcodeproj',
    skipEmptyMod: true,
    isProvider: true,
    async action({ modRequest: { nextMod, ...modRequest }, ...config }) {
      const pbxprojPaths = Paths.getAllPBXProjectPaths(modRequest.projectRoot);

      let results: ExportedConfigWithProps<XcodeProject> = {
        ...config,
        modRequest,
      } as ExportedConfigWithProps<XcodeProject>;

      for (const filePath of pbxprojPaths) {
        const project = xcode.project(filePath);
        project.parseSync();

        results = await nextMod!({
          ...results,
          modResults: project,
          modRequest,
        });

        await writeFile(filePath, results.modResults.writeSync());
      }

      return results;
    },
  });
};
