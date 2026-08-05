"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._lazyDecoratorsPlugin = _lazyDecoratorsPlugin;
exports.lazyDecoratorsPlugins = lazyDecoratorsPlugins;
// Matches `@` followed by a word character — the minimal syntactic
// requirement for any decorator. False positives (JSDoc @tags, email
// addresses) only cause an unnecessary plugin run; false negatives are
// impossible since every decorator starts with `@`.
const DECORATOR_PATTERN = /@\w/;
/**
 * Wraps a plugin so that its transform visitors only run when `detect`
 * returns true for the file being transformed.
 *
 * Any syntax plugin is always inherited so that files parse correctly
 * regardless of the detection result.
 */
function wrapPluginLazy(realPlugin, name, detect) {
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
        name,
        inherits: realPlugin.inherits,
        pre(file) {
            this.decoratorsDetected = detect(file);
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
function containsDecoratorLikeSource(file) {
    return DECORATOR_PATTERN.test(file.code);
}
const _decoratedClassFieldsCache = new WeakMap();
function hasDecoratedClassFields(file) {
    const cached = _decoratedClassFieldsCache.get(file);
    if (cached !== undefined) {
        return cached;
    }
    let detected = false;
    if (containsDecoratorLikeSource(file)) {
        file.path.traverse({
            'ClassProperty|ClassPrivateProperty'(path) {
                if (path.node.decorators?.length) {
                    detected = true;
                    path.stop();
                }
            },
        });
    }
    _decoratedClassFieldsCache.set(file, detected);
    return detected;
}
function _lazyDecoratorsPlugin(api, options) {
    const decoratorsFactory = require('@babel/plugin-proposal-decorators');
    const realPlugin = (decoratorsFactory.default ?? decoratorsFactory)(api, options);
    return wrapPluginLazy(realPlugin, 'expo-lazy-decorators', containsDecoratorLikeSource);
}
const createLazyDecoratedClassFeaturePlugin = (mod, name) => function (api, options) {
    const realPlugin = (mod.default ?? mod)(api, options);
    return wrapPluginLazy(realPlugin, name, hasDecoratedClassFields);
};
const lazyClassPropertiesPlugin = createLazyDecoratedClassFeaturePlugin(require('@babel/plugin-transform-class-properties'), 'expo-lazy-class-properties');
const lazyPrivateMethodsPlugin = createLazyDecoratedClassFeaturePlugin(require('@babel/plugin-transform-private-methods'), 'expo-lazy-private-methods');
const lazyPrivatePropertyInObjectPlugin = createLazyDecoratedClassFeaturePlugin(require('@babel/plugin-transform-private-property-in-object'), 'expo-lazy-private-property-in-object');
function lazyDecoratorsPlugins(options) {
    if (options.presetOptions === false) {
        return [];
    }
    const plugins = [
        [_lazyDecoratorsPlugin, options.presetOptions ?? { legacy: true }],
    ];
    if (options.transformClassProperties)
        plugins.push([lazyClassPropertiesPlugin, { loose: true }]);
    if (options.transformPrivateMethods)
        plugins.push([lazyPrivateMethodsPlugin, { loose: true }]);
    if (options.transformPrivateProperties)
        plugins.push([lazyPrivatePropertyInObjectPlugin, { loose: true }]);
    return plugins;
}
//# sourceMappingURL=lazy-decorators-plugin.js.map