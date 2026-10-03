import type { ExpoConfig, ProjectConfig } from '@expo/config';
import type { DefinedNativePlugin } from 'noxcturnal';

import { expoPluginInput, type Noxcturnal } from '../noxcturnal-transformer';

interface ExpoManifestConfig {
  config: ProjectConfig;
  appName: string | undefined;
  webName: string | undefined;
}

const expoManifestConfigByRoot = new Map<string, ExpoManifestConfig>();

function getExpoConfigPluginProps(
  config: ExpoConfig,
  pluginName: string
): Record<string, unknown> | null {
  const plugin = (config.plugins ?? []).find((value) =>
    Array.isArray(value) ? value[0] === pluginName : value === pluginName
  );
  return Array.isArray(plugin) ? ((plugin[1] ?? null) as Record<string, unknown> | null) : null;
}

function getExpoManifestConfig(projectRoot: string): ExpoManifestConfig {
  const cached = expoManifestConfigByRoot.get(projectRoot);
  if (cached) return cached;
  // Loading Expo config is comparatively expensive and most transforms never
  // reference APP_MANIFEST. Keep it off module initialization and mobile paths.
  const { getConfig, getNameFromConfig } = require('@expo/config') as typeof import('@expo/config');
  const config = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });
  const { appName, webName } = getNameFromConfig(config.exp);
  const result = { config, appName, webName };
  expoManifestConfigByRoot.set(projectRoot, result);
  return result;
}

function getExpoAppManifest(projectRoot: string): string {
  const environmentManifest = process.env.APP_MANIFEST;
  if (environmentManifest) return environmentManifest;
  const { config, appName, webName } = getExpoManifestConfig(projectRoot);
  const appJSON = config.exp;
  const { web: webManifest = {}, ios = {}, android = {} } = appJSON;
  const splash = getExpoConfigPluginProps(appJSON, 'expo-splash-screen');
  const orientation = (webManifest.orientation || appJSON.orientation)?.toLowerCase();
  const manifest: Record<string, unknown> = {
    ...appJSON,
    name: appName,
    description: appJSON.description,
    primaryColor: appJSON.primaryColor,
    ios: { ...ios },
    android: { ...android },
    web: {
      ...webManifest,
      meta: undefined,
      build: undefined,
      scope: webManifest.scope,
      crossorigin: webManifest.crossorigin,
      description: appJSON.description,
      startUrl: webManifest.startUrl,
      shortName: webManifest.shortName || webName,
      display: webManifest.display,
      orientation: orientation === 'default' ? undefined : orientation,
      dir: webManifest.dir,
      barStyle: webManifest.barStyle,
      backgroundColor:
        webManifest.backgroundColor ||
        (typeof splash?.backgroundColor === 'string' ? splash.backgroundColor : undefined),
      themeColor: webManifest.themeColor || appJSON.primaryColor,
      lang: webManifest.lang,
      name: webName,
    },
  };
  for (const field of [
    'androidNavigationBar',
    'androidStatusBar',
    'privacy',
    'ios',
    'android',
    'plugins',
    'hooks',
    '_internal',
    'assetBundlePatterns',
  ] as const) {
    delete manifest[field];
  }
  return JSON.stringify(manifest);
}

export function createExpoInlineManifestPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<{ manifest?: string }> {
  return nox.defineNativePlugin({
    name: 'expo-inline-manifest',
    createState: () => ({}),
    visitors: [
      nox.defineVisitor(
        'StaticMemberExpression',
        {
          where: {
            memberPath: { equals: 'process.env.APP_MANIFEST' },
            write: { equals: false },
          },
        },
        (member, state: { manifest?: string }) => {
          const manifest = (state.manifest ??= getExpoAppManifest(
            expoPluginInput(member.context).projectRoot
          ));
          member.replaceWith(JSON.stringify(manifest));
        }
      ),
    ],
  });
}
