import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';

// Matches `@` followed by a word character — the minimal syntactic
// requirement for any decorator. False positives (JSDoc @tags, email
// addresses) only cause an unnecessary plugin run; false negatives are
// impossible since every decorator starts with `@`.
const DECORATOR_PATTERN = /@\w/;

interface LazyDecoratorsState extends PluginPass {
  decoratorsDetected: boolean;
}

/**
 * Wraps a plugin so that its transform visitors only run when the source
 * contains a potential decorator pattern (`@word`).
 *
 * Any syntax plugin is always inherited so that files parse correctly
 * regardless of the heuristic result.
 */
function wrapPluginLazyOnDecorators(
  realPlugin: PluginObj,
  name: string
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
  return wrapPluginLazyOnDecorators(realPlugin, 'expo-lazy-decorators');
}

function createLazyClassFeaturePlugin(moduleId: string, name: string) {
  return function (
    api: ConfigAPI & typeof import('@babel/core'),
    options: Record<string, unknown>
  ): PluginObj<LazyDecoratorsState> {
    const pluginFactory = require(moduleId);
    const realPlugin: PluginObj = (pluginFactory.default ?? pluginFactory)(api, options);
    return wrapPluginLazyOnDecorators(realPlugin, name);
  };
}

// The (legacy) decorators transform compiles decorated class properties into
// helpers that require `@babel/plugin-transform-class-properties` to run after
// it, otherwise the output throws `Decorating class property failed` at
// runtime. Engine presets that preserve class fields (`hermes-v1`, web) don't
// include the class-feature transforms, so these lazy variants compile class
// features only in files that contain decorators. The private-class transforms
// come along because `plugin-transform-class-properties` refuses to compile a
// class whose private members it cannot also compile.
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
