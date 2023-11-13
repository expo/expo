import { getBaseUrlOption } from '../baseJSBundle';

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
