import { getNamedPlugins } from '../autoAddConfigPluginsAsync';

describe(getNamedPlugins, () => {
  it('gets named plugins', () => {
    expect(
      getNamedPlugins([
        'bacon',
        '@evan/bacon',
        '@evan/bacon/foobar.js',
        ['./avocado.js', null],
        // @ts-ignore
        ['invalid', null, null],
        // @ts-ignore
        c => c,
        // @ts-ignore
        false,
        // @ts-ignore
        [c => c, null],
      ])
    ).toStrictEqual(['bacon', '@evan/bacon', '@evan/bacon/foobar.js', './avocado.js']);
  });
});
