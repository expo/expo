/**
 * Babel plugin for `@expo/ui` that rewrites `Icon.select({ ios, android })`
 * into the value for the bundle's target platform — read from the babel
 * caller — so the unused side is never seen by Metro.
 *
 *   `Icon.select({ ios: 'star.fill', android: require('star.xml') })`
 *     → `'star.fill'`         (iOS bundle)
 *     → `require('star.xml')` (Android bundle)
 *     → `undefined`           (web bundle — `<Icon>` is a no-op there, and
 *                              `undefined` keeps the Android XML out of the
 *                              web bundle)
 *
 * When the caller doesn't expose a platform (test environments, custom Babel
 * configs), the plugin falls back to a runtime ternary instead:
 *
 *   `Icon.select({ ios: 'star.fill', android: require('star.xml') })`
 *     → `process.env.EXPO_OS === 'ios'
 *         ? 'star.fill'
 *         : process.env.EXPO_OS === 'android' ? require('star.xml') : undefined`
 *
 * Inside the `Icon.select` argument, a literal-string `import('*.xml')` in
 * the `android` slot is rewritten to `require('*.xml')` so users can write
 * the `import()` form (which TypeScript validates against the package's
 * `exports` map) while still emitting a static asset reference.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
type State = {
    iconLocalNames?: Set<string>;
    namespaceLocalNames?: Set<string>;
};
export default function expoUiPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<State>;
export {};
