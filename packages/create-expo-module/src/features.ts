import chalk from 'chalk';

import type { NativePlatform } from './prompts';

export const ALL_FEATURES = [
  'Constant',
  'Function',
  'AsyncFunction',
  'Event',
  'View',
  'ViewEvent',
  'SharedObject',
  'SwiftUIView',
  'SwiftUIModifier',
  'ComposeView',
  'ComposeModifier',
] as const;

export type Feature = (typeof ALL_FEATURES)[number];

const SWIFTUI_FEATURES: readonly Feature[] = ['SwiftUIView', 'SwiftUIModifier'];
const COMPOSE_FEATURES: readonly Feature[] = ['ComposeView', 'ComposeModifier'];

/**
 * Features included by `--full-example` / `--features all`. SwiftUI/Compose
 * features are intentionally excluded — they pull in @expo/ui and extend a
 * specific library rather than the core Modules DSL, so users opt in explicitly.
 */
const FULL_EXAMPLE_FEATURES: readonly Feature[] = [
  'Constant',
  'Function',
  'AsyncFunction',
  'Event',
  'View',
  'ViewEvent',
  'SharedObject',
];

/**
 * Features that the Expo Modules API 2.0 doesn't support yet. An Expo Modules API 2.0 module
 * defines them with the Module DSL in a separate views module.
 */
export const VIEWS_MODULE_FEATURES: readonly Feature[] = [
  'View',
  'ViewEvent',
  'SwiftUIView',
  'SwiftUIModifier',
  'ComposeView',
  'ComposeModifier',
];

export function isViewsModuleFeature(feature: Feature): boolean {
  return VIEWS_MODULE_FEATURES.includes(feature);
}

/**
 * Gets the platforms whose native code implements any of the features that the views module of an
 * Expo Modules API 2.0 module defines.
 */
export function getViewsModulePlatforms(
  features: readonly Feature[],
  platforms: readonly NativePlatform[]
): NativePlatform[] {
  return platforms.filter((platform) =>
    features.some(
      (feature) => isViewsModuleFeature(feature) && isNativeFeatureOf(feature, platform)
    )
  );
}

/**
 * Whether the native code of the platform implements the feature. SwiftUI features are only on
 * Apple platforms, and Compose features are only on Android.
 */
function isNativeFeatureOf(feature: Feature, platform: NativePlatform): boolean {
  return platform === 'apple' ? !isComposeFeature(feature) : !isSwiftUIFeature(feature);
}

export function isSwiftUIFeature(feature: Feature): boolean {
  return SWIFTUI_FEATURES.includes(feature);
}

export function isComposeFeature(feature: Feature): boolean {
  return COMPOSE_FEATURES.includes(feature);
}

export function usesSwiftUI(features: readonly Feature[]): boolean {
  return features.some(isSwiftUIFeature);
}

export function usesCompose(features: readonly Feature[]): boolean {
  return features.some(isComposeFeature);
}

export function usesExpoUI(features: readonly Feature[]): boolean {
  return usesSwiftUI(features) || usesCompose(features);
}

/**
 * Validates, deduplicates, and applies ViewEvent→View auto-include.
 */
export function resolveFeatures(selected: string[], fullExample = false): Feature[] {
  if (fullExample) {
    return [...FULL_EXAMPLE_FEATURES];
  }
  const valid = selected.filter((f): f is Feature =>
    (ALL_FEATURES as readonly string[]).includes(f)
  );
  if (valid.includes('ViewEvent') && !valid.includes('View')) {
    valid.unshift('View');
  }

  return [...new Set(valid)] as Feature[];
}

/**
 * Drops features whose required platform was not selected (SwiftUI* require
 * apple, Compose* require android) and warns about each drop.
 */
export function filterFeaturesByPlatforms(
  features: readonly Feature[],
  platforms: readonly string[]
): Feature[] {
  const kept: Feature[] = [];
  const dropped: Feature[] = [];
  for (const feature of features) {
    const requiresApple = isSwiftUIFeature(feature);
    const requiresAndroid = isComposeFeature(feature);
    if (requiresApple && !platforms.includes('apple')) {
      dropped.push(feature);
    } else if (requiresAndroid && !platforms.includes('android')) {
      dropped.push(feature);
    } else {
      kept.push(feature);
    }
  }
  if (dropped.length > 0) {
    console.log(
      chalk.yellow(
        `⚠️  Dropping ${dropped.join(', ')} — required platform not selected ` +
          `(SwiftUI* require apple, Compose* require android).`
      )
    );
  }
  return kept;
}
