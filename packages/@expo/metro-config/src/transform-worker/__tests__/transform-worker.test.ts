import upstreamTransformer, { JsTransformOptions } from 'metro-transform-worker';

import { transform } from '../transform-worker';

jest.mock('metro-transform-worker', () => ({
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
      {
        data: {},
      },
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
    await doTransformForInput('acme.css', 'body { background: red; }', {
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
      ).toMatchInlineSnapshot(`"module.exports={};"`);
    });
    it(`transforms for dev, not minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: false,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={};"`);
    });

    it(`transforms for prod, minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: false,
          minify: true,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={};"`);
    });

    it(`transforms for prod, not minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: false,
          minify: false,
          platform: 'ios',
        })
      ).toMatchInlineSnapshot(`"module.exports={};"`);
    });
  });
  describe('web', () => {
    it(`transforms for dev, minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
          dev: true,
          minify: true,
          platform: 'web',
        })
      ).toMatchSnapshot();
    });
    it(`transforms for dev, not minified`, async () => {
      expect(
        await doTransformForInput('acme.module.css', '.container { background: red; }', {
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
                functionMap: null,
                lineCount: 1,
                map: [],
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
                functionMap: null,
                lineCount: 4,
                map: [],
              },
            },
            type: 'js/module',
          },
        ],
      });
    });
  });
});
