import type { RedirectConfig } from '../getRoutesCore';
import { applyRedirects, convertRedirect, getRedirectSourceRegex } from '../getRoutesRedirects';

function redirect(source: string, destination: string): RedirectConfig {
  return { source, destination } as RedirectConfig;
}

describe(convertRedirect, () => {
  it('fills a dynamic param from the pathname and returns an absolute path', () => {
    expect(convertRedirect('/old/abc', redirect('old/[id]', 'new/[id]'))).toBe('/new/abc');
  });

  it('fills a three-segment source from the pathname', () => {
    expect(
      convertRedirect(
        '/browse/products/sku-1',
        redirect('browse/products/[productId]', 'products/[productId]')
      )
    ).toBe('/products/sku-1');
  });

  it('keeps a query string and hash on the absolute destination', () => {
    expect(convertRedirect('/old/abc?utm_source=x#details', redirect('old/[id]', 'new/[id]'))).toBe(
      '/new/abc?utm_source=x#details'
    );
  });

  it('aligns a source that still has a leading slash', () => {
    expect(convertRedirect('/old/abc', redirect('/old/[id]', '/new/[id]'))).toBe('/new/abc');
  });
});

describe(applyRedirects, () => {
  it('redirects the root path', () => {
    const root = redirect('/', '/home');

    expect(applyRedirects('/', [[getRedirectSourceRegex(root.source), root, false]])).toBe('/home');
  });

  it('throws an error for a redirect loop', () => {
    const a = redirect('/a', '/b');
    const b = redirect('/b', '/a');

    expect(() =>
      applyRedirects('/a', [
        [getRedirectSourceRegex(a.source), a, false],
        [getRedirectSourceRegex(b.source), b, false],
      ])
    ).toThrow(
      'Redirect loop: "/a" redirects back to itself through the redirects and rewrites. Change a "source" or "destination" in the "expo-router" config plugin options so that the redirects end on a route.'
    );
  });
});
