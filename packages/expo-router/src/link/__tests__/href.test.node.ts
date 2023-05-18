import { resolveHref } from '../href';

describe(resolveHref, () => {
  it(`passes strings back without resolution`, () => {
    [
      '/foobar',
      '/foo/[bar]',
      '/foo/[...bar]',
      '/(somn)/foobar',
      '/(somn)/other/(remove)/foobar',
      'Tot4lly Wr0n9',
    ].forEach((href) => {
      expect(resolveHref(href)).toBe(href);
    });
  });

  it(`adds dynamic query parameters`, () => {
    expect(resolveHref({ pathname: '/[some]', params: { some: 'value' } })).toBe('/value');
    expect(
      resolveHref({
        pathname: '/[some]/cool/[thing]',
        params: { some: 'value' },
      })
    ).toBe('/value/cool/[thing]');
    expect(
      resolveHref({
        pathname: '/[some]/cool/[thing]',
        params: { some: 'alpha', thing: 'beta' },
      })
    ).toBe('/alpha/cool/beta');
  });
  it(`adds query parameters`, () => {
    expect(resolveHref({ pathname: '/alpha', params: { beta: 'value' } })).toBe(
      '/alpha?beta=value'
    );
    expect(
      resolveHref({
        pathname: '/alpha',
        params: { beta: 'value', gamma: 'another' },
      })
    ).toBe('/alpha?beta=value&gamma=another');
    expect(
      resolveHref({
        pathname: '/alpha',
        params: {},
      })
    ).toBe('/alpha');
    expect(
      resolveHref({
        pathname: '/alpha/[beta]',
        params: { beta: 'some', gamma: 'another' },
      })
    ).toBe('/alpha/some?gamma=another');
  });
});
