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

import type { ExpoConfig } from 'expo/config';
import type { Manifest as DevLauncherManifest } from 'expo-dev-launcher';
import type {
  EmbeddedManifest,
  EASConfig,
  ExpoGoConfig,
  ExpoUpdatesManifest,
} from 'expo-manifests';

import type { Manifest as UpdatesManifest } from 'expo-updates';

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

// Fall back to ExponentConstants.manifest if we don't have one from Updates
let rawAppConfig: ExpoConfig | null = null;
if (ExponentConstants?.manifest) {
  const appConfig: object | string = ExponentConstants.manifest;

  // On Android we pass the manifest in JSON form so this step is necessary
  if (typeof appConfig === 'string') {
    rawAppConfig = JSON.parse(appConfig);
  } else {
    rawAppConfig = appConfig as any;
  }
}

type RawManifest = UpdatesManifest | DevLauncherManifest | ExpoConfig;
let rawManifest: RawManifest | null = rawAppConfig;

const { name, appOwnership, ...nativeConstants } = (ExponentConstants || {}) as any;

const constants: Constants = {
  ...nativeConstants,
  // Ensure this is null in bare workflow
  appOwnership: appOwnership ?? null,
};

Object.defineProperties(constants, {
  /**
   * Use `manifest` property by default.
   * This property is only used for internal purposes.
   * It behaves similarly to the original one, but suppresses warning upon no manifest available.
   * `expo-asset` uses it to prevent users from seeing mentioned warning.
   */
  __unsafeNoWarnManifest: {
    get(): EmbeddedManifest | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
        return null;
      }
      return maybeManifest;
    },
    enumerable: false,
  },
  __unsafeNoWarnManifest2: {
    get(): ExpoUpdatesManifest | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
        return null;
      }
      return maybeManifest;
    },
    enumerable: false,
  },
  manifest: {
    get(): EmbeddedManifest | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
        return null;
      }
      return maybeManifest;
    },
    enumerable: true,
  },
  manifest2: {
    get(): ExpoUpdatesManifest | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
        return null;
      }
      return maybeManifest;
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
      const maybeManifest = rawManifest;
      if (!maybeManifest) {
        return null;
      }

      if (isExpoUpdatesManifest(maybeManifest)) {
        return maybeManifest.extra?.expoClient ?? null;
      } else if (isEmbeddedManifest(maybeManifest)) {
        return maybeManifest as any;
      }

      return null;
    },
    enumerable: true,
  },
  expoGoConfig: {
    get(): ExpoGoConfig | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest) {
        return null;
      }

      if (isExpoUpdatesManifest(maybeManifest)) {
        return maybeManifest.extra?.expoGo ?? null;
      } else if (isEmbeddedManifest(maybeManifest)) {
        return maybeManifest as any;
      }

      return null;
    },
    enumerable: true,
  },
  easConfig: {
    get(): EASConfig | null {
      const maybeManifest = rawManifest;
      if (!maybeManifest) {
        return null;
      }

      if (isExpoUpdatesManifest(maybeManifest)) {
        return maybeManifest.extra?.eas ?? null;
      } else if (isEmbeddedManifest(maybeManifest)) {
        return maybeManifest as any;
      }

      return null;
    },
    enumerable: true,
  },
  __rawManifest_TEST: {
    get(): RawManifest | null {
      return rawManifest;
    },
    set(value: RawManifest | null) {
      rawManifest = value;
    },
    enumerable: false,
  },
});

function isEmbeddedManifest(manifest: RawManifest): manifest is EmbeddedManifest {
  return true;
}

function isExpoUpdatesManifest(manifest: RawManifest): manifest is ExpoUpdatesManifest {
  return false;
}

export default constants as Constants;
