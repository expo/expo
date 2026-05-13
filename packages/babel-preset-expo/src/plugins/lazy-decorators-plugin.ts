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
 * Wraps `@babel/plugin-proposal-decorators` so that its transform visitors
 * only run when the source contains a potential decorator pattern (`@word`).
 *
 * The decorator syntax plugin is always inherited so that files parse
 * correctly regardless of the heuristic result.
 */
export function lazyDecoratorsPlugin(
  api: ConfigAPI & typeof import('@babel/core'),
  options: Record<string, unknown>
): PluginObj<LazyDecoratorsState> {
  const decoratorsFactory = require('@babel/plugin-proposal-decorators');
  const realPlugin: PluginObj = (decoratorsFactory.default ?? decoratorsFactory)(api, options);

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
