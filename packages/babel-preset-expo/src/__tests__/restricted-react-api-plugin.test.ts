/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  projectRoot: '/',
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',

  babelrc: false,
  presets: [[preset, {}]],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

function getOpts(caller: Record<string, string | boolean>) {
  return {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, ...caller }),
  };
}

describe('forbidden React server APIs', () => {
  function runServerPass(src: string, options = {}) {
    return babel.transform(
      src,
      getOpts({
        isReactServer: true,
        platform: 'ios',
        ...options,
      })
    );
  }
  it(`does not assert importing client-side APIs in client components (react server mode)`, () => {
    // This test covers the order of server registry running before the assertion to remove the import.
    expect(runServerPass(`"use client"; import { useState } from 'react';`)?.code).toMatch(
      'react-server-dom-webpack'
    );
  });
  it(`does not assert importing client-side React functions in server components`, () => {
    runServerPass(`import { useState } from 'react';`);
    runServerPass(`import { useRef, useContext } from 'react';`);
    runServerPass(`import React, { useRef } from 'react';`);
    runServerPass(`import { useRandom } from 'react';`);
  });
  it(`asserts importing client-side React APIs in server components`, () => {
    expect(() => runServerPass(`import React, { PureComponent } from 'react';`)).toThrowError();
    expect(() => runServerPass(`import { PureComponent } from 'react';`)).toThrowError();
    expect(() => runServerPass(`import { Component } from 'react';`)).toThrowError();
  });
  // Support importing but not using. This allows for shared components to import React APIs and only have assertions on usage.
  it(`does not assert importing client-side react-dom APIs in server components`, () => {
    runServerPass(`import { findDOMNode } from 'react-dom';`);
    runServerPass(`import { useRandom } from 'react-dom';`);
  });
  it(`does not assert importing client-side react-dom APIs in server components if they are in node modules`, () => {
    expect(
      babel.transform(`import { findDOMNode } from 'react-dom';`, {
        ...DEF_OPTIONS,
        filename: '/bacon/node_modules/@bacons/breakfast.js',
        caller: getCaller({
          ...ENABLED_CALLER,
          supportsStaticESM: true,
          isReactServer: true,
          platform: 'ios',
        }),
      })?.code
    ).toBe(`import { findDOMNode } from 'react-dom';`);
  });

  it(`asserts client-side React API usage in server components`, () => {
    expect(() =>
      runServerPass(`
    import * as React from 'react';
    
    export default function App() {
      const [state, setState] = React.useState(0);
      return <div>{state}</div>;
    }
    `)
    ).toThrow(/cannot be used in a React server component/);
  });
  it(`asserts if client-side React APIs are used in server components from a named import`, () => {
    expect(() =>
      runServerPass(`
    import { useState } from 'react';
    
    export default function App() {
      const [index, setIndex] = useState(0)
      return <div>{index}</div>;
    }
    `)
    ).toThrow(/cannot be used in a React server component/);
  });
  it(`does not asserts client-side code without React API usage in server components (named import)`, () => {
    expect(() =>
      runServerPass(`
    import { useState } from 'react';
    
    export default function App() {
      const [index, setIndex] = foo()
      return <div>{index}</div>;
    }

    function foo() {}
    `)
    ).not.toThrow();
  });
  it(`asserts client-side React API usage in server components (default import)`, () => {
    expect(() =>
      runServerPass(`
    import React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `)
    ).toThrow(/cannot be used in a React server component/);
  });
  it(`asserts client-side React class component usage in server components`, () => {
    expect(() =>
      runServerPass(`
    import React from 'react';
    
    class App extends React.Component {
        render() {
        return <div />;
        }
    }
    `)
    ).toThrow(/Class components cannot be/);
  });

  it(`allows client-side React API usage in client components`, () => {
    runServerPass(`
    "use client"
    import React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `);
    runServerPass(`
    "use client"
    import * as React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `);
  });

  it(`allows client-side React class component usage in client components`, () => {
    runServerPass(`
      "use client"
    import React from 'react';
    
    class App extends React.Component {
        render() {
        return <div />;
        }
    }
    `);
  });
});
