import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import { getRewriteRequestUrl } from '../rewriteRequestUrl';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '49.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

describe(getRewriteRequestUrl, () => {
  afterEach(() => vol.reset());

  it(`rewrites expo request paths to entry point`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'hey' }),
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    const rewrite = getRewriteRequestUrl('/');

    expect(
      rewrite(
        '/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry'
      )
    ).toBe(
      '/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=true'
    );
  });
  it(`rewrites expo request without changing preset transform options`, () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'hey' }),
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    const rewrite = getRewriteRequestUrl('/');

    expect(
      rewrite(
        '/.expo/.virtual-metro-entry.bundle?platform=ios&transform.routerRoot=RANDOM&transform.engine=RANDOM_TWO'
      )
    ).toBe('/index.bundle?platform=ios&transform.routerRoot=RANDOM&transform.engine=RANDOM_TWO');
  });

  it(`rewrites expo request paths to entry point without hermes`, () => {
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {},
      exp: {
        sdkVersion: '49.0.0',
        name: 'my-app',
        slug: 'my-app',
        jsEngine: 'jsc',
      },
    } as any);
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'hey' }),
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    const rewrite = getRewriteRequestUrl('/');

    expect(
      rewrite(
        '/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry'
      )
    ).toBe(
      '/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry&transform.routerRoot=app'
    );
  });

  it(`rewrites expo request paths to entry point with custom expo router entry`, () => {
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {},
      exp: {
        sdkVersion: '49.0.0',
        name: 'my-app',
        slug: 'my-app',
        extra: {
          router: {
            root: 'foobar',
          },
        },
      },
    } as any);
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'hey' }),
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    const rewrite = getRewriteRequestUrl('/');

    expect(rewrite('/.expo/.virtual-metro-entry.bundle?platform=ios')).toBe(
      '/index.bundle?platform=ios&transform.routerRoot=foobar&transform.engine=hermes&transform.bytecode=true'
    );
  });

  it('rewrites expo request urls to entry point, with host and port', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ name: 'hey' }),
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    const rewrite = getRewriteRequestUrl('/');

    expect(
      rewrite(
        'http://127.0.0.1:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry'
      )
    ).toBe(
      'http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry&transform.routerRoot=app&transform.engine=hermes&transform.bytecode=true'
    );
  });
});
