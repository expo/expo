import JsonFile, { JSONObject, JSONValue } from '@expo/json-file';
import plist from '@expo/plist';
import assert from 'assert';
import fs, { promises } from 'fs';
import path from 'path';
import xcode, { XcodeProject } from 'xcode';

import { ExportedConfig, ModConfig } from '../Plugin.types';
import { Entitlements, Paths } from '../ios';
import { ensureApplicationTargetEntitlementsFileConfigured } from '../ios/Entitlements';
import { InfoPlist } from '../ios/IosConfig.types';
import { getPbxproj } from '../ios/utils/Xcodeproj';
import { getInfoPlistPathFromPbxproj } from '../ios/utils/getInfoPlistPath';
import { fileExists } from '../utils/modules';
import { sortObject } from '../utils/sortObject';
import { addWarningIOS } from '../utils/warnings';
import { ForwardedBaseModOptions, provider, withGeneratedBaseMods } from './createBaseMod';

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
  // Append a rule to supply AppDelegate data to mods on `mods.ios.appDelegate`
  appDelegate: provider<Paths.AppDelegateProjectFile>({
    getFilePath({ modRequest: { projectRoot } }) {
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
  // Append a rule to supply .xcodeproj data to mods on `mods.ios.xcodeproj`
  xcodeproj: provider<XcodeProject>({
    getFilePath({ modRequest: { projectRoot } }) {
      return Paths.getPBXProjectPath(projectRoot);
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
          //: [root]/myapp/ios/MyApp/Info.plist
          const infoPlistPath = path.join(
            //: myapp/ios
            config.modRequest.platformProjectRoot,
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
        if (fs.existsSync(filePath)) {
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

  // Append a rule to supply Podfile.properties.json data to mods on `mods.ios.podfileProperties`
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
};

type IosDefaultProviders = typeof defaultProviders;

export function withIosBaseMods(
  config: ExportedConfig,
  {
    providers,
    ...props
  }: ForwardedBaseModOptions & { providers?: Partial<IosDefaultProviders> } = {}
): ExportedConfig {
  return withGeneratedBaseMods<IosModName>(config, {
    ...props,
    platform: 'ios',
    providers: providers ?? getIosModFileProviders(),
  });
}

export function getIosModFileProviders() {
  return defaultProviders;
}
