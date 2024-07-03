/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/facebook/metro/blob/ebd40efa3bd3363930ffe21120714a4d9e0b7bac/packages/metro-runtime/src/polyfills/__tests__/fast-refresh-integration-test.js#L1
 */

import { Runtime } from './MetroFastRefreshMockRuntime';

jest.useFakeTimers();
jest.unmock('fs');

describe('Fast Refresh integration with require()', () => {
  test('preserves state in a single-module bundle', async () => {
    const { renderer, define, metroRequire, React, events } = new Runtime();

    const ids = {
      'Component.js': 0,
    };

    // Define the initial version of the component
    define(
      (global, _1, _2, _3, module, _5, _6) => {
        module.exports = function Component() {
          const [state] = React.useState('initialState1');
          return 'version1: ' + state;
        };
        // Register the component like `react-refresh/babel` would.
        global.$RefreshReg$(module.exports, 'Component');
      },
      ids['Component.js'],
      undefined,
      'Component.js'
    );

    // Initial render
    const Component = metroRequire(ids['Component.js']);
    let rendered;
    await renderer.act(async () => {
      rendered = renderer.create(<Component />);
    });
    expect(rendered?.toJSON()).toBe('version1: initialState1');

    // Edit the component
    define(
      (global, _1, _2, _3, module, _5, _6) => {
        module.exports = function Component() {
          const [state] = React.useState('initialState2');
          return 'version2: ' + state;
        };
        // Register the component like `react-refresh/babel` would.
        global.$RefreshReg$(module.exports, 'Component');
      },
      ids['Component.js'],
      undefined,
      'Component.js',
      // Inverse dependency map
      {
        [ids['Component.js']]: [],
      }
    );
    jest.runAllTimers();

    // Fast Refresh: Render the new version of the component with the old state.
    expect(rendered?.toJSON()).toBe('version2: initialState1');
    expect(events.onFastRefresh).toHaveBeenCalled();
    expect(events.onFullReload).not.toHaveBeenCalled();
  });

  test('reloads a single-module bundle when invalidated by component signatures', async () => {
    const { renderer, define, metroRequire, React, events } = new Runtime();

    const ids = {
      'Component.js': 0,
    };

    // Define the initial version of the component
    define(
      (global, _1, _2, _3, module, _5, _6) => {
        module.exports = function Component1() {
          const [state] = React.useState('initialState1');
          return 'version1: ' + state;
        };
        // Register the component like `react-refresh/babel` would.
        global.$RefreshReg$(module.exports, 'Component1');
      },
      ids['Component.js'],
      undefined,
      'Component.js'
    );

    // Initial render
    const Component = metroRequire(ids['Component.js']);
    let rendered;
    await renderer.act(async () => {
      rendered = renderer.create(<Component />);
    });
    expect(rendered?.toJSON()).toBe('version1: initialState1');

    // Edit the component
    define(
      (global, _1, _2, _3, module, _5, _6) => {
        module.exports = function Component2() {
          const [state] = React.useState('initialState2');
          return 'version2: ' + state;
        };
        // Register the component like `react-refresh/babel` would.
        global.$RefreshReg$(module.exports, 'Component2');
      },
      ids['Component.js'],
      undefined,
      'Component.js',
      // Inverse dependency map
      {
        [ids['Component.js']]: [],
      }
    );
    jest.runAllTimers();

    // Full refresh: The component does not rerender. Instead, we signal a
    // reload.
    expect(rendered.toJSON()).toBe('version1: initialState1');
    expect(events.onFastRefresh).not.toHaveBeenCalled();
    expect(events.onFullReload).toHaveBeenCalled();
    expect(events.onFullReload.mock.calls).toEqual([
      ['Fast Refresh - Invalidated boundary <Component.js> <Component.js>'],
    ]);
  });
});
