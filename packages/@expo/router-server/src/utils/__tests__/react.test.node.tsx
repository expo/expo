import { isValidElement, type ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';

import { createFaviconAsNode, createInjectedCssAsNodes } from '../react';

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

describe(createInjectedCssAsNodes, () => {
  it('returns no nodes when there is no CSS', () => {
    expect(createInjectedCssAsNodes().headNodes).toEqual([]);
    expect(createInjectedCssAsNodes([]).headNodes).toEqual([]);
  });

  it('renders external stylesheet `<link>`s and preserves the `media` attribute', () => {
    const { headNodes } = createInjectedCssAsNodes([
      { type: 'external', href: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap' },
      {
        type: 'external',
        href: 'https://fonts.googleapis.com/css2?family=Roboto',
        media: 'screen and (min-width: 900px)',
      },
    ]);

    expect(ReactDOMServer.renderToStaticMarkup(<>{headNodes}</>)).toBe(
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto&amp;display=swap"/>' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto" media="screen and (min-width: 900px)"/>'
    );
  });

  it('renders bundled, external, and inline entries, preserving stylesheet cascade order', () => {
    const { headNodes } = createInjectedCssAsNodes([
      { type: 'external', href: 'https://x/y.css' },
      { type: 'css', href: '/a.css' },
      { type: 'inline', source: '.a{}', hmrId: 'a' },
    ]);

    // React hoists `<link rel="preload">` ahead of the other head nodes; the cascade-relevant
    // `<link rel="stylesheet">` order (external `y.css` before bundled `a.css`) is preserved.
    expect(ReactDOMServer.renderToStaticMarkup(<>{headNodes}</>)).toBe(
      '<link rel="preload" href="/a.css" as="style"/>' +
        '<link rel="stylesheet" href="https://x/y.css"/>' +
        '<link rel="stylesheet" href="/a.css"/>' +
        '<style data-expo-css-hmr="a">.a{}</style>'
    );
  });
});
