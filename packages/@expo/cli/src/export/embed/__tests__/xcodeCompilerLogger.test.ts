/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { vol } from 'memfs';

import { getXcodeCompilerErrorMessage } from '../xcodeCompilerLogger';

jest.mock('fs');
describe(getXcodeCompilerErrorMessage, () => {
  beforeEach(() => {
    vol.reset();
  });
  it(`returns message for Metro resolution error`, () => {
    vol.fromJSON(
      {
        'App.js': `
        import React from 'react';
        // hey
        import 'invalid'

        console.log('hello')
        `,
      },
      '/foo/bar'
    );

    expect(
      getXcodeCompilerErrorMessage('/foo/bar', {
        message: `Error: Unable to resolve module invalid from /Users/evanbacon/Documents/GitHub/lab/nov15-err/App.js: invalid could not be found within the project or in these directories:
            node_modules
          [0m [90m 2 |[39m [36mimport[39m { [33mStyleSheet[39m[33m,[39m [33mText[39m[33m,[39m [33mView[39m } [36mfrom[39m [32m"react-native"[39m[33m;[39m[0m
          [0m [90m 3 |[39m[0m
          [0m[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [32m"invalid"[39m[33m;[39m[0m
          [0m [90m   |[39m         [31m[1m^[22m[39m[0m
          [0m [90m 5 |[39m[0m
          [0m [90m 6 |[39m [36mexport[39m [36mdefault[39m [36mfunction[39m [33mApp[39m() {[0m
          [0m [90m 7 |[39m   [36mreturn[39m ([0m`,
        name: 'Error',
        originModulePath: '/foo/bar/App.js',
        targetModuleName: 'invalid',
      })
    ).toBe(
      '/foo/bar/App.js:3:16: error: Error: Unable to resolve module invalid from /Users/evanbacon/Documents/GitHub/lab/nov15-err/App.js: invalid could not be found within the project or in these directories:'
    );
  });
  it(`returns message for Metro transform error`, () => {
    expect(
      getXcodeCompilerErrorMessage('/foo/bar', {
        name: 'Error',
        message: 'Invalid syntax',
        filename: 'App.js',
        lineNumber: 3,
        column: 2,
      })
    ).toBe('/foo/bar/App.js:3:2: error: Invalid syntax');
  });
  it(`returns message for Metro transform error without column`, () => {
    expect(
      getXcodeCompilerErrorMessage('/foo/bar', {
        name: 'Error',
        message: 'Invalid syntax',
        filename: 'App.js',
        lineNumber: 3,
      })
    ).toBe('/foo/bar/App.js:3: error: Invalid syntax');
  });
  it(`returns message for unhandled Metro error`, () => {
    expect(
      getXcodeCompilerErrorMessage('/foo/bar', {
        name: 'Error',
        message: 'whoops!',
      })
    ).toBe('error: whoops!');
  });
});
