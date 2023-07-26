import { vol } from 'memfs';
import nock from 'nock';

import { logEventAsync } from '../../../../utils/analytics/rudderstackClient';
import { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer, getDeepLinkHandler } from '../MetroBundlerDevServer';
import { instantiateMetroAsync } from '../instantiateMetro';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));
jest.mock('../instantiateMetro', () => ({
  instantiateMetroAsync: jest.fn(async () => ({
    middleware: { use: jest.fn() },
    server: { listen: jest.fn(), close: jest.fn() },
  })),
}));
jest.mock('../../../../log');
jest.mock('../../../../utils/analytics/getDevClientProperties', () => jest.fn(() => ({})));
jest.mock('../../../../utils/analytics/rudderstackClient');

beforeEach(() => {
  vol.reset();
});

async function getStartedDevServer(options: Partial<BundlerStartOptions> = {}) {
  const devServer = new MetroBundlerDevServer('/', getPlatformBundlers({}), false);
  devServer['getAvailablePortAsync'] = jest.fn(() => Promise.resolve(3000));
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
  await devServer.startAsync({ location: {}, ...options });
  return devServer;
}

describe('startAsync', () => {
  it(`starts metro`, async () => {
    const devServer = await getStartedDevServer();

    expect(devServer['postStartAsync']).toHaveBeenCalled();

    expect(devServer.getInstance()).toEqual({
      location: {
        host: 'localhost',
        port: expect.any(Number),
        protocol: 'http',
        url: expect.stringMatching(/http:\/\/localhost:\d+/),
      },
      middleware: {
        use: expect.any(Function),
      },
      server: {
        close: expect.any(Function),
        listen: expect.any(Function),
      },
    });

    expect(instantiateMetroAsync).toHaveBeenCalled();
  });
});

describe('onDeepLink', () => {
  it(`logs an event if runtime is custom`, async () => {
    const handler = getDeepLinkHandler('/');
    await handler({ runtime: 'custom', platform: 'ios' });
    expect(logEventAsync).toHaveBeenCalledWith('dev client start command', {
      status: 'started',
    });
  });

  it(`does not log an event if runtime is expo`, async () => {
    const handler = getDeepLinkHandler('/');
    await handler({ runtime: 'expo', platform: 'ios' });
    expect(logEventAsync).not.toHaveBeenCalled();
  });
});

describe('getStaticResourcesAsync', () => {
  beforeEach(() => {
    vol.reset();
  });

  it(`throws from a metro static resource error`, async () => {
    vol.fromJSON(
      {
        'index.js': '',
        'package.json': JSON.stringify({}),
      },
      '/'
    );
    const scope = nock('http://localhost:8081')
      .get(
        '/index.bundle?platform=web&dev=true&hot=false&resolver.environment=client&transform.environment=client&serializer.output=static'
      )
      .reply(
        200,
        JSON.stringify({
          type: 'InternalError',
          errors: [],
          message:
            'Metro has encountered an error: While trying to resolve module `stylis` from file `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js`, the package `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs`. Indeed, none of these files exist:\n' +
            '\n' +
            '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css)\n' +
            '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs/index(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css): /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/metro/src/node-haste/DependencyGraph.js (289:17)\n' +
            '\n' +
            '\x1B[0m \x1B[90m 287 |\x1B[39m         }\x1B[0m\n' +
            '\x1B[0m \x1B[90m 288 |\x1B[39m         \x1B[36mif\x1B[39m (error \x1B[36minstanceof\x1B[39m \x1B[33mInvalidPackageError\x1B[39m) {\x1B[0m\n' +
            '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 289 |\x1B[39m           \x1B[36mthrow\x1B[39m \x1B[36mnew\x1B[39m \x1B[33mPackageResolutionError\x1B[39m({\x1B[0m\n' +
            '\x1B[0m \x1B[90m     |\x1B[39m                 \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
            '\x1B[0m \x1B[90m 290 |\x1B[39m             packageError\x1B[33m:\x1B[39m error\x1B[33m,\x1B[39m\x1B[0m\n' +
            '\x1B[0m \x1B[90m 291 |\x1B[39m             originModulePath\x1B[33m:\x1B[39m \x1B[36mfrom\x1B[39m\x1B[33m,\x1B[39m\x1B[0m\n' +
            '\x1B[0m \x1B[90m 292 |\x1B[39m             targetModuleName\x1B[33m:\x1B[39m to\x1B[33m,\x1B[39m\x1B[0m',
        })
      );

    const devServer = await getStartedDevServer();

    expect(devServer['postStartAsync']).toHaveBeenCalled();

    await expect(
      devServer.getStaticResourcesAsync({ mode: 'development', minify: false })
    ).rejects.toThrowError(
      /Metro has encountered an error: While trying to resolve module `stylis` from/
    );

    expect(scope.isDone()).toBe(true);
  });
});
