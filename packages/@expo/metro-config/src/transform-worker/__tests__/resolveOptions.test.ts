import { shouldMinify } from '../resolveOptions';

describe(shouldMinify, () => {
  it(`returns false when hermes + bytecode`, () => {
    expect(
      shouldMinify({
        unstable_transformProfile: 'hermes-canary',
        minify: true,
        customTransformOptions: {
          __proto__: null,
          bytecode: '1',
        },
      })
    ).toBe(false);
    expect(
      shouldMinify({
        unstable_transformProfile: 'hermes-stable',
        minify: true,
        customTransformOptions: {
          __proto__: null,
          bytecode: '1',
        },
      })
    ).toBe(false);
  });
  it(`returns minify when hermes + no bytecode`, () => {
    expect(
      shouldMinify({
        unstable_transformProfile: 'hermes-canary',
        minify: true,
        customTransformOptions: {
          __proto__: null,
        },
      })
    ).toBe(true);
    expect(
      shouldMinify({
        unstable_transformProfile: 'hermes-stable',
        minify: false,
        customTransformOptions: {
          __proto__: null,
        },
      })
    ).toBe(false);

    expect(
      shouldMinify({
        unstable_transformProfile: 'hermes-stable',
        minify: true,
        customTransformOptions: {
          __proto__: null,
          // A non-`'1'` value must not enable bytecode; the augmented type only models the
          // enabled state (`'1'`), so cast to exercise the strict equality check at runtime.
          bytecode: false as unknown as '1',
        },
      })
    ).toBe(true);
  });

  it(`returns minify with default transform profile`, () => {
    expect(
      shouldMinify({
        unstable_transformProfile: 'default',
        minify: true,
        customTransformOptions: {
          __proto__: null,
        },
      })
    ).toBe(true);
    expect(
      shouldMinify({
        unstable_transformProfile: 'default',
        minify: false,
        customTransformOptions: {
          __proto__: null,
        },
      })
    ).toBe(false);
  });
});
