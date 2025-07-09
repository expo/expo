import type { ExpoConfig } from 'expo/config';
import type {
  EmbeddedManifest,
  EASConfig,
  ExpoGoConfig,
  ExpoUpdatesManifest,
} from 'expo-manifests';
import type { Manifest as UpdatesManifest } from 'expo-updates';

import {
  AndroidManifest,
  AppOwnership,
  Constants,
  ExecutionEnvironment,
  IOSManifest,
  NativeConstants,
  PlatformManifest,
  UserInterfaceIdiom,
  WebManifest,
} from './Constants.types';
import ExponentConstants from './ExponentConstants.web.js';
type DevLauncherManifest = ExpoUpdatesManifest;

export {
  AndroidManifest,
  AppOwnership,
  Constants,
  ExecutionEnvironment,
  IOSManifest,
  NativeConstants,
  PlatformManifest,
  UserInterfaceIdiom,
  WebManifest,
};

type RawManifest = UpdatesManifest | DevLauncherManifest | ExpoConfig;

const PARSED_MANIFEST: RawManifest = (() => {
  if (typeof ExponentConstants?.manifest === 'string') {
    return JSON.parse(ExponentConstants.manifest);
  }
  return ExponentConstants?.manifest as any;
})();

const constants: Constants = ExponentConstants;

Object.defineProperties(constants, {
  /**
   * Use `manifest` property by default.
   * This property is only used for internal purposes.
   * It behaves similarly to the original one, but suppresses warning upon no manifest available.
   * `expo-asset` uses it to prevent users from seeing mentioned warning.
   */
  __unsafeNoWarnManifest: {
    get(): EmbeddedManifest | null {
      return PARSED_MANIFEST as any;
    },
    enumerable: false,
  },
  manifest: {
    get(): EmbeddedManifest | null {
      return PARSED_MANIFEST as any;
    },
    enumerable: true,
  },
  expoConfig: {
    get():
      | (ExpoConfig & {
          /**
           * Only present during development using @expo/cli.
           */
          hostUri?: string;
        })
      | null {
      return PARSED_MANIFEST as any;
    },
    enumerable: true,
  },
  expoGoConfig: {
    get(): ExpoGoConfig | null {
      return PARSED_MANIFEST as any;
    },
    enumerable: true,
  },
  easConfig: {
    get(): EASConfig | null {
      return PARSED_MANIFEST as any;
    },
    enumerable: true,
  },
});

export default constants as Constants;
