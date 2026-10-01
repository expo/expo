import { type ConfigPlugin, withAppBuildGradle } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

/** Marks the line we manage so repeated prebuilds update it instead of stacking copies. */
const MANAGED_COMMENT = '// Added by expo-brownfield (android.bundleInDebug)';
const ASSIGNMENT = 'debuggableVariants = []';

/**
 * React Native registers `createBundle<Variant>JsAndAssets` only for variants that are NOT listed
 * in `debuggableVariants` (default `["debug", "debugOptimized"]`). A stock Expo app therefore has
 * no debug bundling task at all, and forwarding `mergeDebugAssets` into the AAR would copy an
 * assets directory with no JS in it. Clearing the list is what makes the debug variant produce a
 * bundle in the first place.
 *
 * Only the real assignment is managed — the Expo app template ships a commented-out
 * `// debuggableVariants = [...]` hint, which must stay a comment.
 */
export const setDebuggableVariants = (buildGradle: string, bundleInDebug: boolean): string => {
  // Both markers contain regex metacharacters — `(`, `)`, `.`, `[`, `]` — so they have to be
  // escaped before being used as a pattern, or the managed block is never matched and repeated
  // prebuilds stack duplicate assignments.
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const managed = new RegExp(
    `\\n[ \\t]*${escape(MANAGED_COMMENT)}\\n[ \\t]*${escape(ASSIGNMENT)}`,
    'g'
  );
  const withoutManaged = buildGradle.replace(managed, '');

  if (!bundleInDebug) {
    return withoutManaged;
  }

  // `[ \t]*`, not `\s*`: `\s` matches newlines, so a greedy match starting on a preceding blank
  // line would capture `\n` as part of the indent and emit a block the removal pattern can't
  // match — making the insert non-idempotent.
  const reactBlock = /^([ \t]*)react\s*\{/m.exec(withoutManaged);
  if (!reactBlock) {
    throw new Error(
      "expo-brownfield couldn't enable `android.bundleInDebug` because no `react { }` block was " +
        'found in android/app/build.gradle. This block is added by `npx expo prebuild`; run a ' +
        'clean prebuild, or remove `bundleInDebug` from the expo-brownfield plugin options and ' +
        'set `debuggableVariants = []` in that block yourself.'
    );
  }

  const indent = `${reactBlock[1] ?? ''}    `;
  const insertAt = reactBlock.index + reactBlock[0].length;
  return (
    withoutManaged.slice(0, insertAt) +
    `\n${indent}${MANAGED_COMMENT}\n${indent}${ASSIGNMENT}` +
    withoutManaged.slice(insertAt)
  );
};

const withDebugBundlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      // The Expo app template's build.gradle is Groovy; bail out loudly rather than corrupting a
      // Kotlin DSL file we don't know the shape of.
      if (pluginConfig.bundleInDebug) {
        throw new Error(
          'expo-brownfield `android.bundleInDebug` only supports a Groovy android/app/build.gradle. ' +
            `Found ${config.modResults.language}. Set \`debuggableVariants = []\` in its \`react { }\` block manually.`
        );
      }
      return config;
    }

    config.modResults.contents = setDebuggableVariants(
      config.modResults.contents,
      pluginConfig.bundleInDebug
    );
    return config;
  });
};

export default withDebugBundlePlugin;
