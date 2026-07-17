import type { BabelFile, ConfigAPI, PluginObj, PluginPass } from '@babel/core';

// Matches `@` followed by a word character — the minimal syntactic
// requirement for any decorator. False positives (JSDoc @tags, email
// addresses) only cause an unnecessary plugin run; false negatives are
// impossible since every decorator starts with `@`.
const DECORATOR_PATTERN = /@\w/;

interface LazyDecoratorsState extends PluginPass {
  decoratorsDetected: boolean;
}

/**
 * Wraps a plugin so that its transform visitors only run when `detect`
 * returns true for the file being transformed.
 *
 * Any syntax plugin is always inherited so that files parse correctly
 * regardless of the detection result.
 */
function wrapPluginLazy(
  realPlugin: PluginObj,
  name: string,
  detect: (file: BabelFile) => boolean
): PluginObj<LazyDecoratorsState> {
  // Wrap every visitor method to bail out when no decorators are detected.
  const visitor: PluginObj<LazyDecoratorsState>['visitor'] = {};
  for (const [key, value] of Object.entries(realPlugin.visitor as Record<string, any>)) {
    if (typeof value === 'function') {
      const fn = value;
      (visitor as any)[key] = function (path: any, state: LazyDecoratorsState) {
        if (!state.decoratorsDetected) return;
        return fn.call(this, path, state);
      };
    } else if (value && typeof value === 'object') {
      const wrapped: any = {};
      if (value.enter) {
        const enter = value.enter;
        wrapped.enter = function (path: any, state: LazyDecoratorsState) {
          if (!state.decoratorsDetected) return;
          return enter.call(this, path, state);
        };
      }
      if (value.exit) {
        const exit = value.exit;
        wrapped.exit = function (path: any, state: LazyDecoratorsState) {
          if (!state.decoratorsDetected) return;
          return exit.call(this, path, state);
        };
      }
      (visitor as any)[key] = wrapped;
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

function containsDecoratorLikeSource(file: BabelFile): boolean {
  return DECORATOR_PATTERN.test(file.code);
}

// Cached so the three class-feature wrappers below traverse each file at most once.
const decoratedClassFieldsCache = new WeakMap<BabelFile, boolean>();

/**
 * Whether the file contains an actually decorated class property. The regex is
 * only a fast path to skip the AST traversal: unlike the decorators transform,
 * where a false positive is a no-op, activating the class-feature transforms on
 * a false positive (e.g. a JSDoc `@param` tag) would downlevel every class
 * field in the file. Runs in `pre`, before any transform has removed decorators
 * from the AST.
 */
function hasDecoratedClassFields(file: BabelFile): boolean {
  const cached = decoratedClassFieldsCache.get(file);
  if (cached !== undefined) {
    return cached;
  }
  let detected = false;
  if (containsDecoratorLikeSource(file)) {
    file.path.traverse({
      'ClassProperty|ClassPrivateProperty'(path: any) {
        if (path.node.decorators?.length) {
          detected = true;
          path.stop();
        }
      },
    });
  }
  decoratedClassFieldsCache.set(file, detected);
  return detected;
}

/**
 * Wraps `@babel/plugin-proposal-decorators` so that its transform visitors
 * only run when the source contains a potential decorator pattern (`@word`).
 */
export function lazyDecoratorsPlugin(
  api: ConfigAPI & typeof import('@babel/core'),
  options: Record<string, unknown>
): PluginObj<LazyDecoratorsState> {
  const decoratorsFactory = require('@babel/plugin-proposal-decorators');
  const realPlugin: PluginObj = (decoratorsFactory.default ?? decoratorsFactory)(api, options);
  return wrapPluginLazy(realPlugin, 'expo-lazy-decorators', containsDecoratorLikeSource);
}

function createLazyClassFeaturePlugin(moduleId: string, name: string) {
  return function (
    api: ConfigAPI & typeof import('@babel/core'),
    options: Record<string, unknown>
  ): PluginObj<LazyDecoratorsState> {
    const pluginFactory = require(moduleId);
    const realPlugin: PluginObj = (pluginFactory.default ?? pluginFactory)(api, options);
    return wrapPluginLazy(realPlugin, name, hasDecoratedClassFields);
  };
}

// The (legacy) decorators transform compiles decorated class properties into
// helpers that require `@babel/plugin-transform-class-properties` to run after
// it, otherwise the output throws `Decorating class property failed` at
// runtime. Engine presets that preserve class fields (`hermes-v1`, web) don't
// include the class-feature transforms, so these lazy variants compile class
// features only in files that contain a decorated class property (decorated
// methods and class-level decorators don't need them). The private-class
// transforms come along because `plugin-transform-class-properties` refuses to
// compile a class whose private members it cannot also compile.
export const lazyClassPropertiesPlugin = createLazyClassFeaturePlugin(
  '@babel/plugin-transform-class-properties',
  'expo-lazy-class-properties'
);
export const lazyPrivateMethodsPlugin = createLazyClassFeaturePlugin(
  '@babel/plugin-transform-private-methods',
  'expo-lazy-private-methods'
);
export const lazyPrivatePropertyInObjectPlugin = createLazyClassFeaturePlugin(
  '@babel/plugin-transform-private-property-in-object',
  'expo-lazy-private-property-in-object'
);
