// Copyright 2015-present 650 Industries. All rights reserved.

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
import type { ConfigAPI, PluginObj, types as t } from '@babel/core';

type Types = typeof import('@babel/core').types;

type State = {
  // Local-binding names in the current file that resolve to the `Icon` export
  // from `@expo/ui`. A Set (rather than a single name) to handle aliased
  // imports like `import { Icon as MyIcon }`. Empty when the file doesn't
  // import `Icon` — the CallExpression visitor uses `size === 0` as its
  // fast bail.
  iconLocalNames?: Set<string>;
};

const ICON_IMPORT_SOURCE = '@expo/ui';

export default function expoUiPlugin(
  api: ConfigAPI & typeof import('@babel/core')
): PluginObj<State> {
  const { types: t } = api;
  const platform = api.caller((caller) => (caller as { platform?: string } | undefined)?.platform);

  return {
    name: 'expo-ui',

    visitor: {
      // Pre-scan top-level imports before we see any calls. The CallExpression
      // visitor needs to know which local names map to `@expo/ui`'s `Icon`,
      // and computing that lazily inside each call would mean re-walking the
      // import declarations on every match.
      Program: {
        enter(programPath, state) {
          state.iconLocalNames = new Set();

          for (const bodyPath of programPath.get('body')) {
            if (
              !bodyPath.isImportDeclaration() ||
              bodyPath.node.source.value !== ICON_IMPORT_SOURCE
            ) {
              continue;
            }

            for (const specifier of bodyPath.node.specifiers) {
              // Only named `Icon` imports. `import * as ExpoUI from '@expo/ui'`
              // followed by `ExpoUI.Icon.select(...)` would need MemberExpression
              // chain matching, which we don't support.
              if (
                t.isImportSpecifier(specifier) &&
                t.isIdentifier(specifier.imported) &&
                specifier.imported.name === 'Icon'
              ) {
                state.iconLocalNames.add(specifier.local.name);
              }
            }
          }
        },
      },

      CallExpression(path, state) {
        // Fast path: files that don't import Icon from @expo/ui pay only the
        // cost of this branch on every call site in the file.
        if (!state.iconLocalNames || state.iconLocalNames.size === 0) {
          return;
        }

        // Match `<TrackedIconBinding>.select(...)`. Reject computed access
        // (`Icon['select']`) — the static form is the documented API.
        const callee = path.node.callee;
        if (
          !t.isMemberExpression(callee) ||
          callee.computed ||
          !t.isIdentifier(callee.object) ||
          !state.iconLocalNames.has(callee.object.name) ||
          !t.isIdentifier(callee.property) ||
          callee.property.name !== 'select'
        ) {
          return;
        }

        // `extractIosAndroid` returns null for any argument that isn't a plain
        // `{ ios, android }` object literal. `Icon.select(spec)` where `spec`
        // is a variable reference, missing keys, spreads, etc. all fall here
        // — the runtime fallback handles them.
        const values = extractIosAndroid(t, path.node.arguments[0]);
        if (!values) {
          return;
        }

        if (platform === 'ios') {
          path.replaceWith(values.ios);
        } else if (platform === 'android') {
          path.replaceWith(values.android);
        } else if (platform === 'web') {
          path.replaceWith(t.identifier('undefined'));
        } else {
          // Platform unknown — fall back to a runtime ternary. Resolved at
          // runtime; doesn't tree-shake. Three-branched to mirror the
          // platform-known emission, including `undefined` on web.
          path.replaceWith(
            t.conditionalExpression(
              t.binaryExpression('===', expoOsExpression(t), t.stringLiteral('ios')),
              values.ios,
              t.conditionalExpression(
                t.binaryExpression('===', expoOsExpression(t), t.stringLiteral('android')),
                values.android,
                t.identifier('undefined')
              )
            )
          );
        }
        // Skip re-traversing the replacement: the new children don't match
        // the Icon.select pattern, but bailing early avoids running the
        // visitor on them at all.
        path.skip();
      },
    },
  };
}

function expoOsExpression(t: Types): t.MemberExpression {
  return t.memberExpression(
    t.memberExpression(t.identifier('process'), t.identifier('env')),
    t.identifier('EXPO_OS')
  );
}

/**
 * Single pass over the `Icon.select` argument that both extracts the `ios`
 * and `android` values and rewrites a literal-string `import('*.xml')` in
 * the `android` slot to a `require('*.xml')`. Returns `null` if the object
 * shape doesn't match the expected `{ ios, android }` form.
 *
 * Strict matching is intentional: a single unrecognized property (`web`,
 * spread, computed key, method shorthand, etc.) makes us bail rather than
 * guess the user's intent. The runtime `Icon.select` fallback still produces
 * a correct value for those cases — we just don't tree-shake them.
 */
function extractIosAndroid(
  t: Types,
  arg: t.Node | undefined
): { ios: t.Expression; android: t.Expression } | null {
  if (!arg || !t.isObjectExpression(arg)) {
    return null;
  }

  let ios: t.Expression | null = null;
  let android: t.Expression | null = null;

  for (const property of arg.properties) {
    // Bails on SpreadElement, ObjectMethod, computed keys, or non-Expression
    // values (e.g. PatternLike from object destructuring) — anything that
    // isn't a plain `key: value` we can statically read.
    if (!t.isObjectProperty(property) || property.computed || !t.isExpression(property.value)) {
      return null;
    }

    const key = property.key;
    const keyName = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;
    if (keyName !== 'ios' && keyName !== 'android') {
      return null;
    }

    // The `import()` → `require()` rewrite is scoped to the `android` slot.
    // An `import('foo.xml')` placed on `ios` would be nonsensical (iOS expects
    // an SF Symbol string, not an asset id) and is already a TS error.
    let value = property.value;
    if (keyName === 'android' && isLiteralImportCall(t, value)) {
      value = t.callExpression(t.identifier('require'), [value.arguments[0] as t.StringLiteral]);
    }

    if (keyName === 'ios') {
      ios = value;
    } else {
      android = value;
    }
  }

  return ios && android ? { ios, android } : null;
}

// Type guard so `node.arguments[0]` reads as `StringLiteral` after the check,
// without an `as` cast. Matches only `import('static-string')` — dynamic forms
// like `import(variable)` or `import('foo' + bar)` aren't statically resolvable
// by Metro and so won't tree-shake even after rewriting; we leave them alone.
function isLiteralImportCall(
  t: Types,
  node: t.Expression
): node is t.CallExpression & { arguments: [t.StringLiteral] } {
  return (
    t.isCallExpression(node) &&
    t.isImport(node.callee) &&
    node.arguments.length === 1 &&
    t.isStringLiteral(node.arguments[0])
  );
}
