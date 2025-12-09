import { getAssetPrefixOption, getBaseUrlOption } from '../baseJSBundle';

describe(getBaseUrlOption, () => {
  it(`returns the expected base url from dev server options`, () => {
    [
      ['https%3A%2F%2Fexpo.dev', 'https://expo.dev/'],
      ['https://expo.dev', 'https://expo.dev/'],
      ['/foo', '/foo/'],
      ['/', '/'],
    ].forEach(([input, expected]) => {
      expect(
        getBaseUrlOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                baseUrl: input,
              },
            },
          },
          {}
        )
      ).toBe(expected);
    });
  });
  it(`returns the expected base url from direct API usage`, () => {
    [
      ['https%3A%2F%2Fexpo.dev', 'https%3A%2F%2Fexpo.dev/'],
      ['https://expo.dev', 'https://expo.dev/'],
      ['/foo', '/foo/'],
      ['/', '/'],
    ].forEach(([input, expected]) => {
      expect(
        getBaseUrlOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                baseUrl: input,
              },
            },
          },
          {
            serializerOptions: {},
          }
        )
      ).toBe(expected);
    });
  });
});

describe(getAssetPrefixOption, () => {
  it(`returns null when assetPrefix is not set`, () => {
    expect(
      getAssetPrefixOption(
        {
          // @ts-expect-error
          transformOptions: {
            customTransformOptions: {
              __proto__: null,
            },
          },
        },
        {}
      )
    ).toBe(null);
  });

  it(`returns the expected asset prefix from dev server options`, () => {
    [
      ['https%3A%2F%2Fcdn.example.com', 'https://cdn.example.com'],
      ['https://cdn.example.com', 'https://cdn.example.com'],
      ['https://cdn.example.com/', 'https://cdn.example.com'],
      ['/cdn', '/cdn'],
      ['/cdn/', '/cdn'],
    ].forEach(([input, expected]) => {
      expect(
        getAssetPrefixOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                assetPrefix: input,
              },
            },
          },
          {}
        )
      ).toBe(expected);
    });
  });

  it(`returns the expected asset prefix from direct API usage`, () => {
    [
      ['https%3A%2F%2Fcdn.example.com', 'https%3A%2F%2Fcdn.example.com'],
      ['https://cdn.example.com', 'https://cdn.example.com'],
      ['https://cdn.example.com/', 'https://cdn.example.com'],
      ['/cdn', '/cdn'],
      ['/cdn/', '/cdn'],
    ].forEach(([input, expected]) => {
      expect(
        getAssetPrefixOption(
          {
            // @ts-expect-error
            transformOptions: {
              customTransformOptions: {
                __proto__: null,
                assetPrefix: input,
              },
            },
          },
          {
            serializerOptions: {},
          }
        )
      ).toBe(expected);
    });
  });
});
