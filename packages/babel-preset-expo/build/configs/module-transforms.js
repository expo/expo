"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_lazy_imports_1 = require("./utils/expo-lazy-imports");
const rn_lazy_imports_1 = require("./utils/rn-lazy-imports");
/** Module-relevant preset that's run after all other presets */
module.exports = function (_api, options) {
    const plugins = [];
    // Runtime transform (no regenerator for hermes-v0)
    if (options.enableBabelRuntime !== false) {
        const isVersion = typeof options.enableBabelRuntime === 'string';
        plugins.push([
            require('@babel/plugin-transform-runtime'),
            {
                helpers: true,
                regenerator: true,
                ...(isVersion && { version: options.enableBabelRuntime }),
            },
        ]);
    }
    // The export-namespace-from transform must run after TypeScript plugins (which are at the
    // top level) to ensure namespace type exports (`export type * as Types from './module'`)
    // are stripped before the transform. Always included regardless of disableImportExportTransform.
    plugins.push(require('../plugins/babel-plugin-transform-export-namespace-from'));
    if (!options.disableImportExportTransform) {
        // Proposal must come before commonJS so it transforms `export default from`
        // before commonJS converts all imports/exports.
        plugins.push([require('@babel/plugin-proposal-export-default-from')]);
        plugins.push([
            require('@babel/plugin-transform-modules-commonjs'),
            {
                strict: false,
                strictMode: false, // prevent "use strict" injections
                lazy: options.lazyImportExportTransform != null && options.lazyImportExportTransform !== true
                    ? options.lazyImportExportTransform
                    : (importSpecifier) => {
                        if (expo_lazy_imports_1.lazyImports.has(importSpecifier)) {
                            // Never lazy-initialize packages that have side-effects.
                            return false;
                        }
                        else if (rn_lazy_imports_1.lazyImports.has(importSpecifier)) {
                            // Always lazy-initialize `react-native` and the RN lazy imports set.
                            return true;
                        }
                        else if (options.lazyImportExportTransform === true) {
                            // Do not lazy-initialize local imports (similar to `lazy: true` behavior).
                            return !importSpecifier.includes('./');
                        }
                        else {
                            return false;
                        }
                    },
                allowTopLevelThis: true, // dont rewrite global `this` -> `undefined`
            },
        ]);
    }
    return { plugins };
};
//# sourceMappingURL=module-transforms.js.map