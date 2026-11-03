import { normalizeCssAssets } from 'expo-server/private';
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

  it('renders an external stylesheet `<link>` and preserves its `media` attribute', () => {
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

  it('preserves interleaved external, bundled, and inline cascade order', () => {
    const { headNodes } = createInjectedCssAsNodes([
      { type: 'external', href: 'https://x/a.css' },
      { type: 'css', href: '/a.css' },
      { type: 'inline', source: '.a{}', hmrId: 'a' },
      { type: 'external', href: 'https://x/b.css' },
      { type: 'css', href: '/b.css' },
    ]);

    expect(ReactDOMServer.renderToStaticMarkup(<>{headNodes}</>)).toBe(
      '<link rel="preload" href="/a.css" as="style"/>' +
        '<link rel="preload" href="/b.css" as="style"/>' +
        '<link rel="stylesheet" href="https://x/a.css"/>' +
        '<link rel="stylesheet" href="/a.css"/>' +
        '<style data-expo-css-hmr="a">.a{}</style>' +
        '<link rel="stylesheet" href="https://x/b.css"/>' +
        '<link rel="stylesheet" href="/b.css"/>'
    );
  });

  it('streams interleaved stylesheet and inline CSS in cascade order', async () => {
    const { headNodes } = createInjectedCssAsNodes([
      { type: 'external', href: 'https://x/a.css' },
      { type: 'css', href: '/a.css' },
      { type: 'inline', source: '.a{}' },
      { type: 'external', href: 'https://x/b.css' },
      { type: 'css', href: '/b.css' },
    ]);
    const stream = await ReactDOMServer.renderToReadableStream(
      <html>
        <head>{headNodes}</head>
        <body />
      </html>
    );
    const html = await new Response(stream).text();

    expect(html.match(/<link rel="stylesheet"[^>]*>|<style[^>]*>.*?<\/style>/g)).toEqual([
      '<link rel="stylesheet" href="https://x/a.css"/>',
      '<link rel="stylesheet" href="/a.css"/>',
      '<style>.a{}</style>',
      '<link rel="stylesheet" href="https://x/b.css"/>',
      '<link rel="stylesheet" href="/b.css"/>',
    ]);
  });

  it('renders legacy strings before split external CSS', () => {
    const { headNodes } = createInjectedCssAsNodes(
      normalizeCssAssets({
        css: ['/a.css', '/b.css'],
        externalCss: [{ href: 'https://x/a.css', media: 'print' }],
        js: [],
      })
    );
    expect(ReactDOMServer.renderToStaticMarkup(<>{headNodes}</>)).toBe(
      '<link rel="preload" href="/a.css" as="style"/>' +
        '<link rel="preload" href="/b.css" as="style"/>' +
        '<link rel="stylesheet" href="/a.css"/>' +
        '<link rel="stylesheet" href="/b.css"/>' +
        '<link rel="stylesheet" href="https://x/a.css" media="print"/>'
    );
  });
});
