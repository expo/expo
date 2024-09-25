import * as upstreamTransformer from '../metro-transform-worker';
import type { JsTransformOptions } from '../metro-transform-worker';
import { transform } from '../transform-worker';

jest.mock('../metro-transform-worker', () => ({
  transform: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(upstreamTransformer.transform).mockReset();
});

const doTransformForOutput = async (
  filename: string,
  src: string,
  options: Partial<JsTransformOptions>
): Promise<{ input: string; output: any }> => {
  jest.mocked(upstreamTransformer.transform).mockResolvedValueOnce({
    dependencies: [],
    output: [
      // @ts-expect-error
      {},
    ],
  });
  const output = await doTransform(filename, src, options);
  expect(upstreamTransformer.transform).toBeCalledTimes(1);
  return {
    input: jest.mocked(upstreamTransformer.transform).mock.calls[0][3].toString('utf8'),
    output,
  };
};

const doTransformForInput = async (
  filename: string,
  src: string,
  options: Partial<JsTransformOptions>
): Promise<string> => {
  await doTransform(filename, src, options);
  expect(upstreamTransformer.transform).toBeCalledTimes(1);
  return jest.mocked(upstreamTransformer.transform).mock.calls[0][3].toString('utf8');
};
const doTransform = async (filename: string, src: string, options: Partial<JsTransformOptions>) => {
  return transform({} as any, '/', filename, Buffer.from(src), {
    dev: true,
    minify: false,
    platform: 'web',
    type: 'script',
    hot: false,
    inlinePlatform: false,
    inlineRequires: false,
    unstable_transformProfile: 'default',
    ...options,
  });
};

it(`performs a sanity check by transforming a JS file as expected`, async () => {
  expect(
    await doTransformForInput('acme.js', 'export default {}', {
      dev: true,
      minify: false,
      platform: 'web',
    })
  ).toMatchInlineSnapshot(`"export default {}"`);
});

it(`transforms a global CSS file in dev for web`, async () => {
  expect(
    await doTransformForOutput('acme.css', 'body { background: red; }', {
      dev: true,
      minify: false,
      platform: 'web',
    })
  ).toMatchSnapshot();
});

it(`transforms a global CSS file in dev for native`, async () => {
  expect(
    await doTransformForInput('acme.css', 'body { background: red; }', {
      dev: true,
      minify: false,
      platform: 'ios',
    })
  ).toMatchInlineSnapshot(`""`);
});

describe('CSS Modules', () => {
  describe('ios', () => {
    it(`transforms for dev, minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: true,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={ unstable_styles: {} };"`);
    });
    it(`transforms for dev, not minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: false,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={ unstable_styles: {} };"`);
    });

    it(`transforms for prod, minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: false,
          minify: true,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={ unstable_styles: {} };"`);
    });

    it(`transforms for prod, not minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: false,
          minify: false,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={ unstable_styles: {} };"`);
    });
  });
  describe('web', () => {
    it(`transforms for dev, minified`, async () => {
      expect(
        await doTransformForOutput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: true,
          platform: 'web',
        })
      ).toMatchSnapshot();
    });
    it(`transforms for dev, not minified`, async () => {
      expect(
        await doTransformForOutput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: false,
          platform: 'web',
        })
      ).toMatchSnapshot();
    });

    it(`transforms for prod, minified`, async () => {
      const { input, output } = await doTransformForOutput(
        'acme.module.css',
        '.container { background: red; }',
        {
          dev: false,
          minify: true,
          platform: 'web',
        }
      );
      expect(input).toMatchSnapshot();

      // no HMR code
      expect(input).not.toMatch(/document\./);
      // Has keys
      expect(input).toMatch(/_R_BGG_container/);
      expect(output).toEqual({
        dependencies: [],
        output: [
          {
            data: {
              // Required CSS metadata for static export
              css: {
                code: '._R_BGG_container{background:red}',
                externalImports: [],
                functionMap: null,
                lineCount: 1,
                map: [],
                skipCache: false,
              },
            },
            type: 'js/module',
          },
        ],
      });
    });

    it(`transforms for prod, not minified`, async () => {
      const { input, output } = await doTransformForOutput(
        'acme.module.css',
        '.container { background: red; }',
        {
          dev: false,
          minify: false,
          platform: 'web',
        }
      );
      expect(input).toMatchSnapshot();

      // no HMR code
      expect(input).not.toMatch(/document\./);
      // Has keys
      expect(input).toMatch(/_R_BGG_container/);
      expect(output).toEqual({
        dependencies: [],
        output: [
          {
            data: {
              // Required CSS metadata for static export
              css: {
                // Not minified, formatted actually.
                code: ['._R_BGG_container {', '  background: red;', '}', ''].join('\n'),
                externalImports: [],
                functionMap: null,
                lineCount: 4,
                map: [],
                skipCache: false,
              },
            },
            type: 'js/module',
          },
        ],
      });
    });
  });
});

// TODO: Test +api files to ensure all extensions work
describe('Expo Router server files (+html, +api)', () => {
  const matchable = /> The server-only file was removed from the client JS bundle by Expo CLI/;
  it(`strips +html file from client bundles`, async () => {
    for (const file of [
      'app/+html.js',
      'app/+html.ts',
      'app/+html.tsx',
      'app/+html.web.jsx',
      'app/+html.web.ts',
    ]) {
      jest.mocked(upstreamTransformer.transform).mockReset();

      expect(
        (
          await doTransformForOutput(file, 'REMOVE ME!', {
            dev: true,
            minify: false,
            customTransformOptions: {
              __proto__: null,
              environment: 'client',
            },
            platform: 'web',
          })
        ).input
      ).toMatch(matchable);
    }

    // Ensure the server code doesn't leak into the client on any platform.
    for (const platform of ['ios', 'android', 'web']) {
      jest.mocked(upstreamTransformer.transform).mockReset();
      expect(
        (
          await doTransformForOutput('app/+html.js', 'REMOVE ME!', {
            dev: true,
            minify: false,
            customTransformOptions: {
              __proto__: null,
              environment: 'client',
            },
            platform,
          })
        ).input
      ).toMatch(matchable);
    }
  });
  it(`strips without warning when minify is enabled`, async () => {
    expect(
      (
        await doTransformForOutput('app/+html.js', 'KEEP', {
          dev: false,
          minify: true,
          customTransformOptions: {
            __proto__: null,
            environment: 'client',
          },
          platform: 'web',
        })
      ).input
    ).toMatch('');
  });
  it(`modifies server files even if no server indication is provided`, async () => {
    expect(
      (
        await doTransformForOutput('app/+html.js', 'KEEP', {
          dev: true,
          minify: false,
          platform: 'web',
        })
      ).input
    ).toMatch(matchable);
  });
  it(`preserves when bundling for Node.js environments`, async () => {
    expect(
      (
        await doTransformForOutput('app/+html.js', 'KEEP', {
          dev: true,
          minify: false,
          customTransformOptions: {
            __proto__: null,
            environment: 'node',
          },
          platform: 'ios',
        })
      ).input
    ).toMatch('KEEP');
  });
});
