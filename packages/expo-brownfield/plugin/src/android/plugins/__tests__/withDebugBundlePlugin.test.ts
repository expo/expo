import { setDebuggableVariants } from '../withDebugBundlePlugin';

/**
 * Trimmed-down stand-in for the `react { }` block in the Expo app template's
 * `android/app/build.gradle`, including the commented-out `debuggableVariants` hint that ships
 * with it — the comment must not be mistaken for a real assignment.
 */
const APP_BUILD_GRADLE = `apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

react {
    entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')"].execute(null, rootDir).text.trim())
    //   If you add flavors like lite, prod, etc. you'll have to list your debuggableVariants.
    // debuggableVariants = ["liteDebug", "prodDebug"]

    /* Bundling */
    // nodeExecutableAndArgs = ["node"]
}

android {
    namespace 'com.example.app'
}
`;

describe('setDebuggableVariants', () => {
  it('empties debuggableVariants so React Native bundles JS for the debug variant', () => {
    const result = setDebuggableVariants(APP_BUILD_GRADLE, true);

    // React Native only registers `createBundle<Variant>JsAndAssets` for variants that are NOT
    // listed in `debuggableVariants`, so clearing the list is what produces a debug JS bundle.
    expect(result).toContain('debuggableVariants = []');
    // The real assignment must land inside the `react { }` block, not after it.
    const reactBlock = result.slice(result.indexOf('react {'), result.indexOf('android {'));
    expect(reactBlock).toContain('debuggableVariants = []');
  });

  it('does not treat the template comment as an existing assignment', () => {
    const result = setDebuggableVariants(APP_BUILD_GRADLE, true);

    // The commented hint stays a comment, and we add exactly one real assignment.
    expect(result).toContain('// debuggableVariants = ["liteDebug", "prodDebug"]');
    const realAssignments = result.match(/^\s*debuggableVariants\s*=/gm) ?? [];
    expect(realAssignments).toHaveLength(1);
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = setDebuggableVariants(APP_BUILD_GRADLE, true);
    const twice = setDebuggableVariants(once, true);

    expect(twice).toBe(once);
  });

  it('restores the default debug behaviour when turned back off', () => {
    const enabled = setDebuggableVariants(APP_BUILD_GRADLE, true);
    const disabled = setDebuggableVariants(enabled, false);

    // A stale `debuggableVariants = []` would keep bundling (and keep Metro disabled) after the
    // option is removed from app.json, so disabling has to actively undo it.
    expect(disabled.match(/^\s*debuggableVariants\s*=/gm) ?? []).toHaveLength(0);
    expect(disabled).toBe(APP_BUILD_GRADLE);
  });

  it('leaves a project that never enabled the option untouched', () => {
    expect(setDebuggableVariants(APP_BUILD_GRADLE, false)).toBe(APP_BUILD_GRADLE);
  });

  it('fails loudly when there is no react block to configure', () => {
    expect(() => setDebuggableVariants('android {\n}\n', true)).toThrow(/react/);
  });
});
