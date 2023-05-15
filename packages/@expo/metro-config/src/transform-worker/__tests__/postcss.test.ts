import { vol } from 'memfs';

import { resolvePostcssConfig, pluginFactory } from '../postcss';

describe(pluginFactory, () => {
  function doFactory(input: any) {
    const factory = pluginFactory();

    return [
      // @ts-expect-error
      ...factory(input),
    ];
  }
  it(`collects common plugins`, () => {
    expect(
      doFactory({
        'postcss-import': {},
      })
    ).toEqual([['postcss-import', {}]]);
    expect(doFactory(['postcss-import'])).toEqual([['postcss-import', undefined]]);
    expect(doFactory(undefined)).toEqual([]);
    expect(
      doFactory({
        'postcss-import': () => null,
      })
    ).toEqual([['postcss-import', expect.any(Function)]]);
  });
});

describe(resolvePostcssConfig, () => {
  beforeEach(() => {
    vol.reset();
  });
  it('resolves json config', async () => {
    vol.fromJSON(
      {
        'postcss.config.json': JSON.stringify({
          plugins: {
            autoprefixer: {},
          },
        }),
      },
      '/'
    );

    expect(resolvePostcssConfig('/')).toEqual({ plugins: { autoprefixer: {} } });
  });
  it('resolves no config', async () => {
    vol.fromJSON({}, '/');

    expect(resolvePostcssConfig('/')).toEqual(null);
  });
});
