import { isValidElement, type ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import { createFaviconAsNode, createInjectedExternalCssAsNodes } from '../react';

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

describe(createInjectedExternalCssAsNodes, () => {
  it('returns no nodes when there are no external stylesheets', () => {
    expect(createInjectedExternalCssAsNodes().headNodes).toEqual([]);
    expect(createInjectedExternalCssAsNodes([]).headNodes).toEqual([]);
  });

  it('renders an external stylesheet `<link>` and preserves its `media` attribute', () => {
    const { headNodes } = createInjectedExternalCssAsNodes([
      { href: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap' },
      {
        href: 'https://fonts.googleapis.com/css2?family=Roboto',
        media: 'screen and (min-width: 900px)',
      },
    ]);

    expect(ReactDOMServer.renderToStaticMarkup(<>{headNodes}</>)).toBe(
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto&amp;display=swap"/>' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto" media="screen and (min-width: 900px)"/>'
    );
  });
});
