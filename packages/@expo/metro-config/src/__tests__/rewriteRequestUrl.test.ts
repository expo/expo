import { vol } from 'memfs';

import { getRewriteRequestUrl } from '../rewriteRequestUrl';

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
      '/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry'
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
      'http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry'
    );
  });
});
