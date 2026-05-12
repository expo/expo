/**
 * Wire up expo-brownfield's bundled mangling logic in the Podfile.
 * Replaces the third-party `cocoapods-mangle` gem so users don't need a
 * Gemfile entry. Two insertions:
 *   1. A `require` line near the top of the Podfile that loads
 *      `scripts/ios/mangle.rb` from the expo-brownfield npm package.
 *   2. A `ExpoBrownfield::Mangle.run!(installer, ...)` call inside the
 *      `post_install` block (created if absent) that invokes the
 *      bundled Node worker to generate the mangling xcconfig.
 *
 * Both insertions are idempotent — re-running prebuild against an already
 * patched Podfile is a no-op.
 */
export declare const addManglePlugin: (podfile: string, targetName: string) => string;
export declare const addNewPodsTarget: (podfile: string, targetName: string) => string;
export declare const addPrebuiltSettings: (podfile: string) => string;
