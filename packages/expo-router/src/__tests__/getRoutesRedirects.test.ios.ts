import type { RedirectConfig } from '../getRoutesCore';
import { convertRedirect } from '../getRoutesRedirects';

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
    expect(
      convertRedirect('/old/abc?utm_source=x#details', redirect('old/[id]', 'new/[id]'))
    ).toBe('/new/abc?utm_source=x#details');
  });

  it('aligns a source that still has a leading slash', () => {
    expect(convertRedirect('/old/abc', redirect('/old/[id]', '/new/[id]'))).toBe('/new/abc');
  });
});
