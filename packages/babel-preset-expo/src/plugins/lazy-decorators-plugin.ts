import type { BabelFile, ConfigAPI, PluginItem, PluginObj, PluginPass } from '@babel/core';

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

const _decoratedClassFieldsCache = new WeakMap<BabelFile, boolean>();

function hasDecoratedClassFields(file: BabelFile): boolean {
  const cached = _decoratedClassFieldsCache.get(file);
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
  _decoratedClassFieldsCache.set(file, detected);
  return detected;
}

export function _lazyDecoratorsPlugin(
  api: ConfigAPI & typeof import('@babel/core'),
  options: Record<string, unknown>
): PluginObj<LazyDecoratorsState> {
  const decoratorsFactory = require('@babel/plugin-proposal-decorators');
  const realPlugin: PluginObj = (decoratorsFactory.default ?? decoratorsFactory)(api, options);
  return wrapPluginLazy(realPlugin, 'expo-lazy-decorators', containsDecoratorLikeSource);
}

const createLazyDecoratedClassFeaturePlugin = (mod: any, name: string) =>
  function (
    api: ConfigAPI & typeof import('@babel/core'),
    options: Record<string, unknown>
  ): PluginObj<LazyDecoratorsState> {
    const realPlugin: PluginObj = (mod.default ?? mod)(api, options);
    return wrapPluginLazy(realPlugin, name, hasDecoratedClassFields);
  };

const lazyClassPropertiesPlugin = createLazyDecoratedClassFeaturePlugin(
  require('@babel/plugin-transform-class-properties'),
  'expo-lazy-class-properties'
);

const lazyPrivateMethodsPlugin = createLazyDecoratedClassFeaturePlugin(
  require('@babel/plugin-transform-private-methods'),
  'expo-lazy-private-methods'
);

const lazyPrivatePropertyInObjectPlugin = createLazyDecoratedClassFeaturePlugin(
  require('@babel/plugin-transform-private-property-in-object'),
  'expo-lazy-private-property-in-object'
);

export interface LazyDecoratorsOptions {
  presetOptions: { legacy?: boolean; version?: number } | false | undefined;
  transformClassProperties: boolean;
  transformPrivateMethods: boolean;
  transformPrivateProperties: boolean;
}

export function lazyDecoratorsPlugins(options: LazyDecoratorsOptions): PluginItem[] {
  if (options.presetOptions === false) {
    return [];
  }
  const plugins: PluginItem[] = [
    [_lazyDecoratorsPlugin, options.presetOptions ?? { legacy: true }],
  ];
  if (options.transformClassProperties) plugins.push([lazyClassPropertiesPlugin, { loose: true }]);
  if (options.transformPrivateMethods) plugins.push([lazyPrivateMethodsPlugin, { loose: true }]);
  if (options.transformPrivateProperties)
    plugins.push([lazyPrivatePropertyInObjectPlugin, { loose: true }]);
  return plugins;
}
