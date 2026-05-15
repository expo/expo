"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoUiJetpackCompose = getExpoUiJetpackCompose;
exports.getExpoUiJetpackComposeModifiers = getExpoUiJetpackComposeModifiers;
function missingMessage(feature) {
    return ("Cannot load optional peer dependency '@expo/ui'. " +
        `${feature} relies on '@expo/ui' but the package isn't installed. ` +
        'Install it with `npx expo install @expo/ui`.');
}
const MISSING = Symbol('missing');
let jetpackCompose;
let jetpackComposeModifiers;
/**
 * @param feature Short description of the feature requiring `@expo/ui`,
 *                included verbatim in the thrown error (e.g. "`Stack.Toolbar.View` on Android").
 */
function getExpoUiJetpackCompose(feature) {
    if (jetpackCompose === undefined) {
        try {
            jetpackCompose = require('@expo/ui/jetpack-compose');
        }
        catch {
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
function getExpoUiJetpackComposeModifiers(feature) {
    if (jetpackComposeModifiers === undefined) {
        try {
            jetpackComposeModifiers = require('@expo/ui/jetpack-compose/modifiers');
        }
        catch {
            jetpackComposeModifiers = MISSING;
        }
    }
    if (jetpackComposeModifiers === MISSING || !jetpackComposeModifiers) {
        throw new Error(missingMessage(feature));
    }
    return jetpackComposeModifiers;
}
//# sourceMappingURL=expo-ui.js.map