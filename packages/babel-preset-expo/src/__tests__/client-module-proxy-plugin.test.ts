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
  presets: [[preset, { disableImportExportTransform: true }]],
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

it(`asserts that use client and use server cannot be used together`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
  };

  const sourceCode = `
    'use server';
    'use client';
    
    export const greet = (name: string) => \`Hello $\{name} from server!\`;
    `;

  expect(() => babel.transform(sourceCode, options)).toThrowErrorMatchingSnapshot();
});

describe('use client', () => {
  it(`does nothing without use client directive`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
      export const foo = 'bar';
    `;

    const contents = babel.transform(sourceCode, options)!.code;

    expect(contents).toMatchSnapshot();
    expect(contents).not.toMatch('react-server-dom-webpack');
  });
  it(`collects metadata with React client references`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
    "use client";
    import { Text } from 'react-native';
    
    export const foo = 'bar';
    
    export default function App() {
      return <Text>Hello World</Text>
    }
    `;

    const contents = babel.transform(sourceCode, options);
    expect(contents.code).toMatch('react-server-dom-webpack');
  });

  it(`does not collect metadata when bundling for the client`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: false, platform: 'ios' }),
    };

    const sourceCode = `
    "use client";
    import { Text } from 'react-native';
    
    export const foo = 'bar';
    
    export default function App() {
      return <Text>Hello World</Text>
    }
    `;

    const contents = babel.transform(sourceCode, options);
    expect(contents.metadata).toEqual({});

    expect(contents.code).not.toMatch('react-server-dom-webpack');
  });

  it(`replaces client exports with React client references`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
  "use client";
  import { Text } from 'react-native';
  
  export const foo = 'bar';
  
  export default function App() {
    return <Text>Hello World</Text>
  }
  `;

    const contents = babel.transform(sourceCode, options)!.code;
    expect(contents).toMatchSnapshot();

    expect(contents).toMatch('react-server-dom-webpack');
  });
});

describe('use server', () => {
  it(`replaces server action exports with React server references`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
        'use server';
      
        export const greet = (name: string) => \`Hello $\{name} from server!\`;
      `;

    const contents = babel.transform(sourceCode, options)!.code;
    expect(contents).toMatchSnapshot();
  });
});
