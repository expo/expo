import { vol } from 'memfs';

import { resolvePostcssConfig, getPostcssConfigHash, pluginFactory } from '../postcss';

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

    expect(await resolvePostcssConfig('/')).toEqual({ plugins: { autoprefixer: {} } });
  });

  it('resolves no config', async () => {
    vol.fromJSON({}, '/');

    expect(await resolvePostcssConfig('/')).toEqual(null);
  });
});

describe(getPostcssConfigHash, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('resolves mjs config', async () => {
    vol.fromJSON(
      {
        'postcss.config.mjs': `export default {};`,
      },
      '/'
    );

    expect(await getPostcssConfigHash('/')).toEqual('1fd6ca7084e3f233a8c79cd1144ef59f');
  });
});
