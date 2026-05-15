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
type JetpackCompose = typeof import('@expo/ui/jetpack-compose');
type JetpackComposeModifiers = typeof import('@expo/ui/jetpack-compose/modifiers');
/**
 * @param feature Short description of the feature requiring `@expo/ui`,
 *                included verbatim in the thrown error (e.g. "`Stack.Toolbar.View` on Android").
 */
export declare function getExpoUiJetpackCompose(feature: string): JetpackCompose;
/**
 * @param feature Short description of the feature requiring `@expo/ui`,
 *                included verbatim in the thrown error (e.g. "`Stack.Toolbar.View` on Android").
 */
export declare function getExpoUiJetpackComposeModifiers(feature: string): JetpackComposeModifiers;
export {};
//# sourceMappingURL=expo-ui.d.ts.map