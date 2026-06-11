import * as upstreamTransformer from '../metro-transform-worker';
import type { JsTransformOptions } from '../metro-transform-worker';
import { transform } from '../transform-worker';
import * as transformShimMod from '../transformShim';

jest.mock('../metro-transform-worker', () => ({
  transform: jest.fn(),
}));

jest.mock('../transformShim', () => ({
  transformShim: jest.fn(),
}));

const emptyTransformResult = (): any => ({
  dependencies: [],
  // The CSS pipeline merges `output[0].data` into its own; returning a bare
  // object here keeps the snapshot output focused on the CSS metadata.
  output: [{}],
});

const resetTransformMocks = () => {
  jest.mocked(upstreamTransformer.transform).mockReset().mockResolvedValue(emptyTransformResult());
  jest.mocked(transformShimMod.transformShim).mockReset().mockReturnValue(emptyTransformResult());
};

beforeEach(resetTransformMocks);

// Returns whichever of `metro-transform-worker.transform` or `transformShim`
// the CSS pipeline actually invoked. The two are mutually exclusive: CSS shims
// take the synchronous `transformShim` path; everything else still goes through
// the full Babel pipeline.
const getWrappedBody = (): string => {
  const workerCalls = jest.mocked(upstreamTransformer.transform).mock.calls;
  const shimCalls = jest.mocked(transformShimMod.transformShim).mock.calls;
  expect(workerCalls.length + shimCalls.length).toBe(1);
  return workerCalls.length ? workerCalls[0][3].toString('utf8') : (shimCalls[0][2] as string);
};

const doTransformForOutput = async (
  filename: string,
  src: string,
  options: Partial<JsTransformOptions>
): Promise<{ input: string; output: any }> => {
  const output = await doTransform(filename, src, options);
  return { input: getWrappedBody(), output };
};

const doTransformForInput = async (
  filename: string,
  src: string,
  options: Partial<JsTransformOptions>
): Promise<string> => {
  await doTransform(filename, src, options);
  return getWrappedBody();
};
const doTransform = async (filename: string, src: string, options: Partial<JsTransformOptions>) => {
  return transform({} as any, '/', filename, Buffer.from(src), {
    dev: true,
    minify: false,
    platform: 'web',
    type: 'script',
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

describe('Global CSS', () => {
  it(`automatically strips redundant vendor prefixes`, async () => {
    const fixture = `
      .button {
        -webkit-border-radius: 10px; /* Chrome, Safari, Edge (WebKit) */
        -moz-border-radius: 10px;    /* Firefox */
        -ms-border-radius: 10px;     /* Internet Explorer */
        border-radius: 10px;         /* Standard, unprefixed property */
      }
      `;

    const css = (
      await doTransformForOutput('acme.css', fixture, {
        dev: true,
        minify: true,
        platform: 'web',
      })
    ).output.output[0].data.css.code;

    expect(css).not.toMatch(/-webkit-transition/);
    expect(css).toEqual('.button{-ms-border-radius:10px;border-radius:10px}');
  });
  it(`automatically injects vendor prefixes`, async () => {
    const fixture = `
      .button {
         background: image-set("image1.jpg" 1x, "image2.jpg" 2x);
      }
      `;

    const css = (
      await doTransformForOutput('acme.css', fixture, {
        dev: true,
        minify: true,
        platform: 'web',
      })
    ).output.output[0].data.css.code;

    expect(css).toMatch(/-webkit-image-set/);
  });
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

    it(`automatically strips redundant vendor prefixes`, async () => {
      const fixture = `
      .button {
        -webkit-border-radius: 10px; /* Chrome, Safari, Edge (WebKit) */
        -moz-border-radius: 10px;    /* Firefox */
        -ms-border-radius: 10px;     /* Internet Explorer */
        border-radius: 10px;         /* Standard, unprefixed property */
      }
      `;

      const css = (
        await doTransformForOutput('acme.module.css', fixture, {
          dev: true,
          minify: true,
          platform: 'web',
        })
      ).output.output[0].data.css.code;

      expect(css).not.toMatch(/-webkit-transition/);
      expect(css).toEqual('._R_BGG_button{-ms-border-radius:10px;border-radius:10px}');
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
  describe('+html', () => {
    it(`strips file from client bundles`, async () => {
      for (const file of [
        'app/+html.js',
        'app/+html.ts',
        'app/+html.tsx',
        'app/+html.web.jsx',
        'app/+html.web.ts',
      ]) {
        resetTransformMocks();

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
        resetTransformMocks();
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

  describe('+middleware', () => {
    it(`strips file from client bundles`, async () => {
      for (const file of [
        'app/+middleware.js',
        'app/+middleware.ts',
        'app/+middleware.jsx',
        'app/+middleware.tsx',
      ]) {
        resetTransformMocks();

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
        resetTransformMocks();
        expect(
          (
            await doTransformForOutput('app/+middleware.js', 'REMOVE ME!', {
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
          await doTransformForOutput('app/+middleware.js', 'KEEP', {
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
          await doTransformForOutput('app/+middleware.js', 'KEEP', {
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
          await doTransformForOutput('app/+middleware.js', 'KEEP', {
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
});
