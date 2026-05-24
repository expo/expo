"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyDecoratorsPlugin = lazyDecoratorsPlugin;
// Matches `@` followed by a word character — the minimal syntactic
// requirement for any decorator. False positives (JSDoc @tags, email
// addresses) only cause an unnecessary plugin run; false negatives are
// impossible since every decorator starts with `@`.
const DECORATOR_PATTERN = /@\w/;
/**
 * Wraps `@babel/plugin-proposal-decorators` so that its transform visitors
 * only run when the source contains a potential decorator pattern (`@word`).
 *
 * The decorator syntax plugin is always inherited so that files parse
 * correctly regardless of the heuristic result.
 */
function lazyDecoratorsPlugin(api, options) {
    const decoratorsFactory = require('@babel/plugin-proposal-decorators');
    const realPlugin = (decoratorsFactory.default ?? decoratorsFactory)(api, options);
    // Wrap every visitor method to bail out when no decorators are detected.
    const visitor = {};
    for (const [key, value] of Object.entries(realPlugin.visitor)) {
        if (typeof value === 'function') {
            const fn = value;
            visitor[key] = function (path, state) {
                if (!state.decoratorsDetected)
                    return;
                return fn.call(this, path, state);
            };
        }
        else if (value && typeof value === 'object') {
            const wrapped = {};
            if (value.enter) {
                const enter = value.enter;
                wrapped.enter = function (path, state) {
                    if (!state.decoratorsDetected)
                        return;
                    return enter.call(this, path, state);
                };
            }
            if (value.exit) {
                const exit = value.exit;
                wrapped.exit = function (path, state) {
                    if (!state.decoratorsDetected)
                        return;
                    return exit.call(this, path, state);
                };
            }
            visitor[key] = wrapped;
        }
    }
    return {
        name: 'expo-lazy-decorators',
        inherits: realPlugin.inherits,
        pre(file) {
            this.decoratorsDetected = DECORATOR_PATTERN.test(file.code);
            if (this.decoratorsDetected && realPlugin.pre) {
                realPlugin.pre.call(this, file);
            }
        },
        visitor,
        post(file) {
            if (this.decoratorsDetected && realPlugin.post) {
                realPlugin.post.call(this, file);
            }
        },
    };
}
//# sourceMappingURL=lazy-decorators-plugin.js.map