import { isValidElement, type ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import { createFaviconAsNode } from '../react';

describe(createFaviconAsNode, () => {
  it('returns a `<link rel="icon" />` element with a stable key and the given href', () => {
    const node = createFaviconAsNode('/favicon.ico') as ReactElement<{
      rel: string;
      href: string;
    }> & {
      key: string | null;
    };
    expect(isValidElement(node)).toBe(true);
    expect(node.type).toBe('link');
    expect(node.props.rel).toBe('icon');
    expect(node.props.href).toBe('/favicon.ico');
    expect(node.key).toBe('favicon');
  });

  it('renders to the expected static markup', () => {
    expect(
      ReactDOMServer.renderToStaticMarkup(createFaviconAsNode('/favicon.ico') as ReactElement)
    ).toBe('<link rel="icon" href="/favicon.ico"/>');
  });
});
