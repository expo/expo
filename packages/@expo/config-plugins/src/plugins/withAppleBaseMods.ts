import JsonFile, { JSONObject, JSONValue } from '@expo/json-file';
import plist from '@expo/plist';
import assert from 'assert';
import fs, { promises } from 'fs';
import path from 'path';
import xcode, { XcodeProject } from 'xcode';

import { ForwardedBaseModOptions, provider, withGeneratedBaseMods } from './createBaseMod';
import type { ExportedConfig, ModConfig } from '../Plugin.types';
import { Entitlements, Paths } from '../apple';
import type { InfoPlist } from '../apple/AppleConfig.types';
import { ensureApplicationTargetEntitlementsFileConfigured } from '../apple/Entitlements';
import { getPbxproj } from '../apple/utils/Xcodeproj';
import { getInfoPlistPathFromPbxproj } from '../apple/utils/getInfoPlistPath';
import { fileExists } from '../utils/modules';
import { sortObject } from '../utils/sortObject';
import { addWarningForPlatform } from '../utils/warnings';

const { readFile, writeFile } = promises;

type AppleModName = keyof Required<ModConfig>['ios' | 'macos'];

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

const defaultProviders = (applePlatform: 'ios' | 'macos') => ({
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
      return Paths.getAppDelegateFilePath(applePlatform)(projectRoot);
    },
    async read(filePath) {
      return Paths.getFileInfo(filePath);
    },
    async write(filePath: string, { modResults: { contents } }) {
      await writeFile(filePath, contents);
    },
  }),
  // Append a rule to supply Expo.plist data to mods on `mods.ios.expoPlist` or
  // `mods.macos.expoPlist`
  expoPlist: provider<JSONObject>({
    isIntrospective: true,
    getFilePath({ modRequest: { platformProjectRoot, projectName } }) {
      const supportingDirectory = path.join(platformProjectRoot, projectName!, 'Supporting');
      return path.resolve(supportingDirectory, 'Expo.plist');
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
  // Append a rule to supply .xcodeproj data to mods on `mods.ios.xcodeproj` or
  // `mods.macos.xcodeproj`
  xcodeproj: provider<XcodeProject>({
    getFilePath({ modRequest: { projectRoot } }) {
      return Paths.getPBXProjectPath(applePlatform)(projectRoot);
    },
    async read(filePath) {
      const project = xcode.project(filePath);
      project.parseSync();
      return project;
    },
    async write(filePath, { modResults }) {
      await writeFile(filePath, modResults.writeSync());
    },
  }),
  // Append a rule to supply Info.plist data to mods on `mods.ios.infoPlist` or
  // `mods.macos.infoPlist`
  infoPlist: provider<InfoPlist, ForwardedBaseModOptions>({
    isIntrospective: true,
    async getFilePath(config) {
      let project: xcode.XcodeProject | null = null;
      try {
        project = getPbxproj(applePlatform)(config.modRequest.projectRoot);
      } catch {
        // noop
      }

      // Only check / warn if a project actually exists, this'll provide
      // more accurate warning messages for users in managed projects.
      if (project) {
        const infoPlistBuildProperty = getInfoPlistPathFromPbxproj(applePlatform)(project);

        if (infoPlistBuildProperty) {
          //: [root]/myapp/[applePlatform]/MyApp/Info.plist
          const infoPlistPath = path.join(
            //: myapp/[applePlatform]
            config.modRequest.platformProjectRoot,
            //: MyApp/Info.plist
            infoPlistBuildProperty
          );
          if (fileExists(infoPlistPath)) {
            return infoPlistPath;
          }
          addWarningForPlatform(
            applePlatform,
            `mods.${applePlatform}.infoPlist`,
            `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`
          );
        } else {
          addWarningForPlatform(
            applePlatform,
            `mods.${applePlatform}.infoPlist`,
            'Failed to find Info.plist linked to Xcode project.'
          );
        }
      }
      try {
        // Fallback on glob...
        return await Paths.getInfoPlistPath(applePlatform)(config.modRequest.projectRoot);
      } catch (error: any) {
        if (config.modRequest.introspect) {
          // fallback to an empty string in introspection mode.
          return '';
        }
        throw error;
      }
    },
    async read(filePath, config) {
      // Apply all of the Info.plist values to the `expo.ios.infoPlist` or
      // `expo.macos.infoPlist` object

      // TODO: Remove this in favor of just overwriting the Info.plist with the Expo object. This will enable people to actually remove values.
      if (!config[applePlatform]) config[applePlatform] = {};
      if (!config[applePlatform]!.infoPlist) config[applePlatform]!.infoPlist = {};

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

      config[applePlatform]!.infoPlist = {
        ...(modResults || {}),
        ...config[applePlatform]!.infoPlist,
      };

      return config[applePlatform]!.infoPlist!;
    },
    async write(filePath, config) {
      // Update the contents of the static infoPlist object
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform]!.infoPlist = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }

      await writeFile(filePath, plist.build(sortObject(config.modResults)));
    },
  }),
  // Append a rule to supply .entitlements data to mods on
  // `mods.ios.entitlements` or `mods.macos.entitlements`
  entitlements: provider<JSONObject, ForwardedBaseModOptions>({
    isIntrospective: true,

    async getFilePath(config) {
      try {
        ensureApplicationTargetEntitlementsFileConfigured(applePlatform)(
          config.modRequest.projectRoot
        );
        return Entitlements.getEntitlementsPath(applePlatform)(config.modRequest.projectRoot) ?? '';
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

      // Apply all of the .entitlements values to the `expo.ios.entitlements` or
      // `expo.macos.entitlements` object
      // TODO: Remove this in favor of just overwriting the .entitlements with the Expo object. This will enable people to actually remove values.
      if (!config[applePlatform]) config[applePlatform] = {};
      if (!config[applePlatform]!.entitlements) config[applePlatform]!.entitlements = {};

      config[applePlatform]!.entitlements = {
        ...(modResults || {}),
        ...config[applePlatform]!.entitlements,
      };

      return config[applePlatform]!.entitlements!;
    },

    async write(filePath, config) {
      // Update the contents of the static entitlements object
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform]!.entitlements = config.modResults;

      // Return early without writing, in introspection mode.
      if (config.modRequest.introspect) {
        return;
      }

      await writeFile(filePath, plist.build(sortObject(config.modResults)));
    },
  }),

  podfile: provider<Paths.PodfileProjectFile>({
    getFilePath({ modRequest: { projectRoot } }) {
      return Paths.getPodfilePath(applePlatform)(projectRoot);
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

  // Append a rule to supply Podfile.properties.json data to mods on
  // `mods.ios.podfileProperties` or `mods.macos.podfileProperties`
  podfileProperties: provider<Record<string, JSONValue>>({
    isIntrospective: true,

    getFilePath({ modRequest: { platformProjectRoot } }) {
      return path.resolve(platformProjectRoot, 'Podfile.properties.json');
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
});

type AppleDefaultProviders = ReturnType<typeof defaultProviders>;

export const withAppleBaseMods =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: ExportedConfig,
    {
      providers,
      ...props
    }: ForwardedBaseModOptions & { providers?: Partial<AppleDefaultProviders> } = {}
  ): ExportedConfig => {
    return withGeneratedBaseMods<AppleModName>(config, {
      ...props,
      platform: applePlatform,
      providers: providers ?? getAppleModFileProviders(applePlatform),
    });
  };

/**
 * A lazy-initialized record of defaultProviders values by platform. Allows us
 * to return the same defaultProviders value for the platform each time.
 */
const lazyDefaultProvidersByPlatform = {} as Partial<
  Record<'ios' | 'macos', AppleDefaultProviders>
>;
export const getAppleModFileProviders = (applePlatform: 'ios' | 'macos') => {
  // Lazy-initialize (and thereafter reuse) the defaultProviders value for each
  // applePlatform.
  let defaultProvidersForPlatform = lazyDefaultProvidersByPlatform[applePlatform];
  if (!defaultProvidersForPlatform) {
    defaultProvidersForPlatform = defaultProviders(applePlatform);
    lazyDefaultProvidersByPlatform[applePlatform] = defaultProvidersForPlatform;
  }
  return defaultProvidersForPlatform;
};
