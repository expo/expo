/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import { minifyLikeMetroAsync } from './minify-util';
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
  caller: getCaller({ ...ENABLED_CALLER, supportsStaticESM: true, platform: 'ios' }),
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
    filename: '/samples/foo.tsx',
    caller: getCaller({ ...ENABLED_CALLER, ...caller }),
  };
}

describe('unwrap RSC hooks', () => {
  function runServerPass(src: string) {
    return babel.transform(
      src,
      getOpts({
        isReactServer: true,
        platform: 'ios',
      })
    );
  }

  it(`folds useMemo from direct react import with external function`, async () => {
    const code = runServerPass(`
  import { useMemo } from 'react';

  function baz() {
    return 650;
  }
  
  export default function App() {
    const foo = useMemo(baz, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('useMemo(');
    expect(code).toMatch('= baz()');
    expect(code).toMatchSnapshot();
  });
  it(`folds useMemo from direct react import`, async () => {
    const code = runServerPass(`
  import { useMemo } from 'react';
  
  export default function App() {
      const foo = useMemo(() => {
          return 650;
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('useMemo(');
    expect(code).toMatchSnapshot();
  });
  it(`folds useMemo from react import`, async () => {
    const code = runServerPass(`
  import React from 'react';
  
  export default function App() {
      const foo = React.useMemo(() => {
          return 650;
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('useMemo(');
    expect(code).toMatchSnapshot();
  });

  it(`strips useEffect from direct react import`, async () => {
    const code = runServerPass(`
  import { useEffect } from 'react';
  
  export default function App() {
      useEffect(() => {
          console.log('foo')
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('foo');
  });
  it(`strips useEffect from star react import`, async () => {
    const code = runServerPass(`
  import * as React from 'react';
  
  export default function App() {
    React.useEffect(() => {
          console.log('foo')
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('foo');
  });
  it(`strips useEffect from default react import`, async () => {
    const code = runServerPass(`
  import React from 'react';
  
  export default function App() {
    React.useEffect(() => {
          console.log('foo')
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('foo');
  });
  it(`strips useLayoutEffect from default react import`, async () => {
    const code = runServerPass(`
  import React from 'react';
  
  export default function App() {
    React.useLayoutEffect(() => {
          console.log('foo')
      }, [true])
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).not.toMatch('foo');
  });
  // TODO: Blocked on slicing https://github.com/facebook/react-native/pull/43662
  it(`strips useState from react import`, async () => {
    const code = runServerPass(`
  import { useState } from 'react';
  
  export default function App() {
    const [s, setS] = useState(420)
    return <div>Hey</div>;
  }
  `)!.code!;
    // expect((await minifyLikeMetroAsync({ code })).code).toBe('');

    expect(code).not.toMatch('useState(');

    // Ensure only one instance of `useState` in `code`
    expect(code.match(/useState/g)).toHaveLength(1);
  });
  it(`strips useState from react import 2 (expo-linking)`, async () => {
    const code = runServerPass(`
    import { UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NativeLinking from './ExpoLinking';
import { parse } from './createURL';
import { validateURL } from './validateURL';

export function addEventListener(type, handler) {
    return NativeLinking.addEventListener(type, handler);
}

export async function parseInitialURLAsync() {
    const initialUrl = await NativeLinking.getInitialURL();
    if (!initialUrl) {
        return {
            scheme: null,
            hostname: null,
            path: null,
            queryParams: null,
        };
    }
    return parse(initialUrl);
}

export async function sendIntent(action, extras) {
    if (Platform.OS === 'android') {
        return await NativeLinking.sendIntent(action, extras);
    }
    throw new UnavailabilityError('Linking', 'sendIntent');
}

export async function openSettings() {
    if (Platform.OS === 'web') {
        throw new UnavailabilityError('Linking', 'openSettings');
    }
    if (NativeLinking.openSettings) {
        return await NativeLinking.openSettings();
    }
    await openURL('app-settings:');
}

export async function getInitialURL() {
    return (await NativeLinking.getInitialURL()) ?? null;
}

export async function openURL(url) {
    validateURL(url);
    return await NativeLinking.openURL(url);
}

export async function canOpenURL(url) {
    validateURL(url);
    return await NativeLinking.canOpenURL(url);
}

export function useURL() {
    const [url, setLink] = useState(null);
    function onChange(event) {
        setLink(event.url);
    }
    useEffect(() => {
        getInitialURL().then((url) => setLink(url));
        const subscription = addEventListener('url', onChange);
        return () => subscription.remove();
    }, []);
    return url;
}
export * from './Linking.types';
export * from './Schemes';
export { parse, createURL } from './createURL';
//# sourceMappingURL=Linking.js.map
  `)!.code!;
    // expect((await minifyLikeMetroAsync({ code })).code).toBe('');

    expect(code).toMatchInlineSnapshot(`
      "import { useState } from 'react';
      export function useURL() {
        const [url, setLink] = [null, () => {
          return null;
        }];
        return url;
      }"
    `);

    // Ensure only one instance of `useState` in `code`
    expect(code.match(/useState/g)).toHaveLength(1);
  });

  it(`strips useState from react import (expo-linking)`, async () => {
    const code = runServerPass(`
    import { useEffect, useState } from 'react';

    export function useURL(): string | null {
      const [url, setLink] = useState<string | null>(null);
      return url;
    }
  `)!.code!;
    // expect((await minifyLikeMetroAsync({ code })).code).toBe('');

    expect(code).toMatchInlineSnapshot(`
      "import { useState } from 'react';
      export function useURL() {
        const [url, setLink] = [null, () => {
          return null;
        }];
        return url;
      }"
    `);

    // Ensure only one instance of `useState` in `code`
    expect(code.match(/useState/g)).toHaveLength(1);
  });
  // Known limitation for now.
  it(`cannot strip context removed useState from react import`, async () => {
    const code = runServerPass(`
  import { useState } from 'react';
  
  export default function App() {
    const [s, setS] = (0, useState)(420)
    return <div>Hey</div>;
  }
  `)!.code!;
    expect(code).toMatch('useState)');
  });
});
