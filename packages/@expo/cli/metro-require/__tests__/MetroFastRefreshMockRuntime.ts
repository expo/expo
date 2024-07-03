/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * https://github.com/facebook/metro/blob/ebd40efa3bd3363930ffe21120714a4d9e0b7bac/packages/metro-runtime/src/polyfills/__tests__/MetroFastRefreshMockRuntime.js#L1
 */

import type {DefineFn, RequireFn} from '../require';
import typeof React from 'react';
import typeof ReactRefreshRuntime from 'react-refresh/runtime';
import typeof ReactTestRenderer from 'react-test-renderer';

import {transformSync} from '@babel/core';
import fs from 'fs';

jest.unmock('fs');
jest.unmock('resolve-from');


type RuntimeGlobal = Object;

/**
 * A runtime that combines Metro's module system, a React renderer
 * (react-test-renderer) and Fast Refresh.
 *
 * The runtime has its own global object and dedicated instances of the relevant
 * Metro/React modules, but otherwise runs in the enclosing JS context without
 * any true isolation.
 */
export class Runtime {
  // Metro APIs (see require.js)

  /**
   * Adds a module implementation to the module registry.
   */
  define: DefineFn;

  /**
   * Evaluates a given module (if not already evaluated) and returns its exports
   * object.
   */
  metroRequire: RequireFn;

  // Special modules

  /**
   * The instance of React running in this runtime. Conceptually equivalent to
   * require('react').
   */
  React: React;

  /**
   * The React renderer running in this runtime. Conceptually equivalent to
   * require('react-test-renderer').
   */
  renderer: ReactTestRenderer;

  /**
   * Jest mock functions used as event handlers.
   */
  events: {
    onFullReload: JestMockFn<[string], void>,
    onFastRefresh: JestMockFn<[], void>,
  } = {
    /**
     * Called when there is a full reload, with a reason argument.
     */
    onFullReload: jest.fn(),

    /**
     * Called when Fast Refresh has occured.
     */
    onFastRefresh: jest.fn(),
  };

  // $FlowFixMe[value-as-type]: react-refresh/runtime is untyped
  #reactRefreshRuntime: ReactRefreshRuntime;
  #global: RuntimeGlobal = {};
  #globalPrefix: string = '';

  constructor() {
    // Set up the module system and expose relevant APIs.
    createModuleSystem(this.#global, /* __DEV__ */ true, this.#globalPrefix);
    this.define = this.#global[this.#globalPrefix + '__d'];
    this.metroRequire = this.#global[this.#globalPrefix + '__r'];

    // Set up Fast Refresh. Adapted from `setUpReactRefresh.js` in React Native.
    jest.isolateModules(() => {
      // $FlowFixMe[incompatible-type] Not sure why Flow doesn't approve
      // $FlowFixMe[prop-missing]
      this.React = require('react');

      this.#reactRefreshRuntime = require('react-refresh/runtime');
      this.#reactRefreshRuntime.injectIntoGlobalHook(this.#global);

      // Associate the renderer instance with this runtime's global object.
      // NOTE: Strictly speaking, this is an implementation detail of React.
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ =
        this.#global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      this.renderer = require('react-test-renderer');
      delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    });

    // Inject Fast Refresh APIs called by Metro.
    this.#global[this.#globalPrefix + '__ReactRefresh'] = {
      performFullRefresh: (reason: string) => {
        this.events.onFullReload(reason);
      },

      createSignatureFunctionForTransform:
        this.#reactRefreshRuntime.createSignatureFunctionForTransform,

      isLikelyComponentType: this.#reactRefreshRuntime.isLikelyComponentType,

      getFamilyByType: this.#reactRefreshRuntime.getFamilyByType,

      register: this.#reactRefreshRuntime.register,

      performReactRefresh: () => {
        if (this.#reactRefreshRuntime.hasUnrecoverableErrors()) {
          this.events.onFullReload('Fast Refresh - Unrecoverable');
          return;
        }
        this.#reactRefreshRuntime.performReactRefresh();
        this.events.onFastRefresh();
      },
    };
  }
}

export const moduleSystemCode = (() => {
  const rawCode = fs.readFileSync(require.resolve('../require.ts'), 'utf8');
  return transformSync(rawCode, {
    ast: false,
    babelrc: false,
    cwd: '/',
    filename: 'test.ts',
    presets: [require.resolve('babel-preset-expo')],
    retainLines: true,
    sourceMaps: 'inline',
    sourceType: 'module',
  }).code;
})();

export const createModuleSystem: (RuntimeGlobal, boolean, string) => any =
  // eslint-disable-next-line no-new-func
  new Function(
    'global',
    '__DEV__',
    '__METRO_GLOBAL_PREFIX__',
    moduleSystemCode,
  );
