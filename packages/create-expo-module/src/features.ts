import { styleText } from 'node:util';

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
      styleText(
        'yellow',
        `⚠️  Dropping ${dropped.join(', ')} — required platform not selected ` +
          `(SwiftUI* require apple, Compose* require android).`
      )
    );
  }
  return kept;
}
