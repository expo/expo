/**
 * Lazy, cached accessors for `@expo/ui` sub-modules.
 *
 * `@expo/ui` is declared as an optional peer dependency because only a small
 * subset of expo-router features need it (currently Android implementations of
 * `Stack.Toolbar` components). The `require` call is deferred until the
 * accessor is invoked — typically inside a component body — so that consumers
 * who never use those features don't pay the cost and don't crash if the
 * package isn't installed.
 *
 * On miss we cache the failure with a sentinel so we don't pay the
 * try/catch cost (or hit Node's resolution machinery) on every render.
 */

function missingMessage(feature: string) {
  return (
    "Cannot load optional peer dependency '@expo/ui'. " +
    `${feature} relies on '@expo/ui' but the package isn't installed. ` +
    'Install it with `npx expo install @expo/ui`.'
  );
}

type JetpackCompose = typeof import('@expo/ui/jetpack-compose');
type JetpackComposeModifiers = typeof import('@expo/ui/jetpack-compose/modifiers');

const MISSING = Symbol('missing');
type CacheSlot<T> = T | typeof MISSING | undefined;

let jetpackCompose: CacheSlot<JetpackCompose>;
let jetpackComposeModifiers: CacheSlot<JetpackComposeModifiers>;

/**
 * @param feature Short description of the feature requiring `@expo/ui`,
 *                included verbatim in the thrown error (e.g. "`Stack.Toolbar.View` on Android").
 */
export function getExpoUiJetpackCompose(feature: string): JetpackCompose {
  if (jetpackCompose === undefined) {
    try {
      jetpackCompose = require('@expo/ui/jetpack-compose');
    } catch {
      jetpackCompose = MISSING;
    }
  }
  if (jetpackCompose === MISSING || !jetpackCompose) {
    throw new Error(missingMessage(feature));
  }
  return jetpackCompose;
}

/**
 * @param feature Short description of the feature requiring `@expo/ui`,
 *                included verbatim in the thrown error (e.g. "`Stack.Toolbar.View` on Android").
 */
export function getExpoUiJetpackComposeModifiers(feature: string): JetpackComposeModifiers {
  if (jetpackComposeModifiers === undefined) {
    try {
      jetpackComposeModifiers = require('@expo/ui/jetpack-compose/modifiers');
    } catch {
      jetpackComposeModifiers = MISSING;
    }
  }
  if (jetpackComposeModifiers === MISSING || !jetpackComposeModifiers) {
    throw new Error(missingMessage(feature));
  }
  return jetpackComposeModifiers;
}
