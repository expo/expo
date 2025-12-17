import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
import type { ExpoConfig, ProjectConfig } from 'expo/config';

import { getIsReactServer, getPlatform, getPossibleProjectRoot } from './common';

const debug = require('debug')('expo:babel:inline-manifest');

// Convert expo value to PWA value
function ensurePWAorientation(orientation?: string) {
  if (orientation) {
    const webOrientation = orientation.toLowerCase();
    if (webOrientation !== 'default') {
      return webOrientation;
    }
  }
  return undefined;
}

const RESTRICTED_MANIFEST_FIELDS: (keyof ExpoConfig)[] = [
  'androidNavigationBar',
  'androidStatusBar',
  'privacy',
  // Remove iOS and Android.
  'ios',
  'android',
  // Hide internal / build values
  'plugins',
  'hooks' as any, // hooks no longer exists in the typescript type but should still be removed
  '_internal',
  // Remove metro-specific values
  'assetBundlePatterns',
];

function getExpoConstantsManifest(projectRoot: string) {
  const config = getConfigMemo(projectRoot);
  if (!config) return null;
  const manifest = applyWebDefaults(config);
  for (const field of RESTRICTED_MANIFEST_FIELDS) {
    delete manifest[field];
  }
  return manifest;
}
function applyWebDefaults({ config, appName, webName }: ConfigMemo) {
  const appJSON: ExpoConfig = config.exp;
  // For RN CLI support
  const { web: webManifest = {}, splash = {}, ios = {}, android = {} } = appJSON;
  const languageISOCode = webManifest.lang;
  const primaryColor = appJSON.primaryColor;
  const description = appJSON.description;
  // The theme_color sets the color of the tool bar, and may be reflected in the app's preview in task switchers.
  const webThemeColor = webManifest.themeColor || primaryColor;
  const dir = webManifest.dir;
  const shortName = webManifest.shortName || webName;
  const display = webManifest.display;
  const startUrl = webManifest.startUrl;
  const { scope, crossorigin } = webManifest;
  const barStyle = webManifest.barStyle;
  const orientation = ensurePWAorientation(webManifest.orientation || appJSON.orientation);
  /**
   * **Splash screen background color**
   * `https://developers.google.com/web/fundamentals/web-app-manifest/#splash-screen`
   * The background_color should be the same color as the load page,
   * to provide a smooth transition from the splash screen to your app.
   */
  const backgroundColor = webManifest.backgroundColor || splash.backgroundColor; // No default background color
  return {
    ...appJSON,
    name: appName,
    description,
    primaryColor,
    // Ensure these objects exist
    ios: {
      ...ios,
    },
    android: {
      ...android,
    },
    web: {
      ...webManifest,
      meta: undefined,
      build: undefined,
      scope,
      crossorigin,
      description,
      startUrl,
      shortName,
      display,
      orientation,
      dir,
      barStyle,
      backgroundColor,
      themeColor: webThemeColor,
      lang: languageISOCode,
      name: webName,
    },
  };
}

function getExpoAppManifest(projectRoot: string) {
  if (process.env.APP_MANIFEST) {
    return process.env.APP_MANIFEST;
  }

  const exp = getExpoConstantsManifest(projectRoot);
  if (exp) {
    debug('public manifest', exp);
    return JSON.stringify(exp);
  } else {
    debug('public manifest is null. `expo/config` is not available');
    return null;
  }
}

interface ConfigMemo {
  config: ProjectConfig;
  appName: string | undefined;
  webName: string | undefined;
}

let configMemo: undefined | null | ConfigMemo;

function getConfigMemo(projectRoot: string): ConfigMemo | null {
  if (configMemo === undefined) {
    let expoConfig: typeof import('expo/config');
    try {
      // This is an optional dependency. In practice, it will resolve in all Expo projects/apps
      // since `expo` is a direct dependency in those. If `babel-preset-expo` is used independently
      // this will fail and we won't return a config
      expoConfig = require('expo/config');
    } catch (error: any) {
      if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
        return (configMemo = null);
      }
      throw error;
    }
    const { getConfig, getNameFromConfig } = expoConfig;
    const config = getConfig(projectRoot, {
      isPublicConfig: true,
      skipSDKVersionRequirement: true,
    });
    // rn-cli apps use a displayName value as well.
    const { appName, webName } = getNameFromConfig(config.exp);
    configMemo = {
      config,
      appName,
      webName,
    };
  }
  return configMemo;
}

interface InlineManifestState extends PluginPass {
  projectRoot?: string;
}

// Convert `process.env.APP_MANIFEST` to a modified web-specific variation of the app.json public manifest.
export function expoInlineManifestPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;

  const isReactServer = api.caller(getIsReactServer);
  const platform = api.caller(getPlatform);
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);
  const shouldInline = platform === 'web' || isReactServer;

  // Early exit: return a no-op plugin if we're not going to inline anything
  if (!shouldInline) {
    return {
      name: 'expo-inline-manifest-plugin',
      visitor: {},
    };
  }

  return {
    name: 'expo-inline-manifest-plugin',

    pre() {
      (this as InlineManifestState).projectRoot =
        possibleProjectRoot || this.file.opts.root || '';
    },

    visitor: {
      MemberExpression(path, state: InlineManifestState) {
        // We're looking for: process.env.APP_MANIFEST
        // This visitor is called on every MemberExpression, so we need fast checks

        // Quick check: the property we're looking for is 'APP_MANIFEST'
        // The parent must be a MemberExpression with property 'APP_MANIFEST'
        const parent = path.parentPath;
        if (!parent?.isMemberExpression()) return;

        // Check if parent's property is APP_MANIFEST (most selective check first)
        const parentProp = parent.node.property;
        if (!t.isIdentifier(parentProp) || parentProp.name !== 'APP_MANIFEST') return;

        // Now verify this is process.env
        const obj = path.node.object;
        const prop = path.node.property;
        if (!t.isIdentifier(obj) || obj.name !== 'process') return;
        if (!t.isIdentifier(prop) || prop.name !== 'env') return;

        // Skip if this is an assignment target
        if (parent.parentPath?.isAssignmentExpression()) return;

        // Surfaces the `app.json` (config) as an environment variable which is then parsed by
        // `expo-constants` https://docs.expo.dev/versions/latest/sdk/constants/
        const manifest = getExpoAppManifest(state.projectRoot!);
        if (manifest !== null) {
          parent.replaceWith(t.stringLiteral(manifest));
        }
      },
    },
  };
}
