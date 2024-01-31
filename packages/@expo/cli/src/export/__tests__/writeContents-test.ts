import { createAssetMap } from '../writeContents';

describe(createAssetMap, () => {
  it(`writes asset map to disk`, async () => {
    const results = createAssetMap({
      assets: [{ hash: 'alpha' }, { hash: 'beta' }] as any,
    });

    expect(results).toStrictEqual({
      alpha: { hash: 'alpha' },
      beta: { hash: 'beta' },
    });
  });
});
