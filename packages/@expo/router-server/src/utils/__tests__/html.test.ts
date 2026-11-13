import { runInNewContext } from 'node:vm';

import { createFaviconAsString, getLoaderDataScriptContents, injectAssetsIntoHtml } from '../html';

describe(getLoaderDataScriptContents, () => {
  it('escapes unsafe characters and round-trips the data', () => {
    const data = {
      '/': {
        dangerous: '<script>alert("XSS")</script>',
        nested: { value: '</script><script>alert("nested")</script>' },
        multiple: '<<<multiple>>>',
        quotes: 'He said "Hello"',
        backslash: 'C:\\Users\\test',
        newline: 'Line 1\nLine 2',
        unicode: '你好世界 🌍',
        ampersand: 'A & B',
        separators: '\u2028\u2029',
      },
    };

    const script = getLoaderDataScriptContents(data);

    expect(script.match(/[<>&\u2028\u2029]/g)).toBeNull();
    const globals: Record<string, unknown> = {};
    runInNewContext(script, globals);
    expect(globals.__EXPO_ROUTER_LOADER_DATA__).toEqual(data);
  });
});

describe(createFaviconAsString, () => {
  it('returns the matching `<link rel="icon" />` markup', () => {
    expect(createFaviconAsString('/favicon.ico')).toBe('<link rel="icon" href="/favicon.ico"/>');
  });

  it('escapes attribute-unsafe characters in the href', () => {
    expect(createFaviconAsString('/icons?size=32&q="x"')).toBe(
      '<link rel="icon" href="/icons?size=32&amp;q=&quot;x&quot;"/>'
    );
  });
});

describe(injectAssetsIntoHtml, () => {
  const TEMPLATE = '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>';

  it('returns the template unchanged when there is nothing to inject', () => {
    expect(injectAssetsIntoHtml(TEMPLATE, {})).toBe(TEMPLATE);
    expect(injectAssetsIntoHtml(TEMPLATE, { assets: { css: [], js: [] } })).toBe(TEMPLATE);
  });

  it('injects the favicon before the hydration flag and styles', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      hydrate: true,
      assets: { css: [{ type: 'css', href: '/a.css' }], js: [], favicon: '/favicon.ico' },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="icon" href="/favicon.ico"/>',
        '<script type="module">globalThis.__EXPO_ROUTER_HYDRATE__=true;</script>',
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
      ])
    );
  });

  it('only injects the hydration flag when `hydrate` is truthy', () => {
    expect(injectAssetsIntoHtml(TEMPLATE, { hydrate: false })).not.toContain(
      '__EXPO_ROUTER_HYDRATE__'
    );
    expect(injectAssetsIntoHtml(TEMPLATE, {})).not.toContain('__EXPO_ROUTER_HYDRATE__');
    expect(injectAssetsIntoHtml(TEMPLATE, { hydrate: true })).toContain('__EXPO_ROUTER_HYDRATE__');
  });

  it('treats legacy plain-string CSS entries as bundled hrefs', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: { css: ['/a.css'], js: [] },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
      ])
    );
  });

  it('injects export CSS hrefs as link tags, joined without separators', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: [
          { type: 'css', href: '/a.css' },
          { type: 'css', href: '/b.css' },
        ],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
        '<link rel="preload" href="/b.css" as="style">\n<link rel="stylesheet" href="/b.css">',
      ])
    );
  });

  it('injects development inline CSS as style tags with HMR IDs', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: [
          { type: 'inline', source: '.a{}', hmrId: 'a' },
          { type: 'inline', source: '.b{}', hmrId: 'b' },
        ],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<style data-expo-css-hmr="a">.a{}\n</style>',
        '<style data-expo-css-hmr="b">.b{}\n</style>',
      ])
    );
  });

  it.each([
    [undefined, '<style>.a{}\n</style>'],
    ['', '<style data-expo-css-hmr="">.a{}\n</style>'],
    ['a"&b', '<style data-expo-css-hmr="a&quot;&amp;b">.a{}\n</style>'],
  ])('serializes the inline HMR identifier %j safely', (hmrId, expected) => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: { css: [{ type: 'inline', source: '.a{}', hmrId }], js: [] },
    });
    expect(result).toContain(expectedHead([expected!]));
  });

  it('preserves interleaved external, bundled, and inline CSS order', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: [
          { type: 'external', href: 'https://x/a.css' },
          { type: 'css', href: '/a.css' },
          { type: 'inline', source: '.a{}' },
          { type: 'external', href: 'https://x/b.css' },
          { type: 'css', href: '/b.css' },
        ],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="stylesheet" href="https://x/a.css">',
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
        '<style>.a{}\n</style>',
        '<link rel="stylesheet" href="https://x/b.css">',
        '<link rel="preload" href="/b.css" as="style">\n<link rel="stylesheet" href="/b.css">',
      ])
    );
  });

  it('preserves and escapes external CSS attributes with serializer-compatible markup', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: [
          {
            type: 'external',
            href: 'https://x/y.css?a=1&b="two"',
            media: 'screen and (min-width: "900px")',
          },
        ],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="stylesheet" href="https://x/y.css?a=1&amp;b=&quot;two&quot;" media="screen and (min-width: &quot;900px&quot;)">',
      ])
    );
  });

  it('preserves the legacy bundled-before-external render order for split manifests', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: ['/a.css'],
        externalCss: [{ href: 'https://x/y.css', media: 'print' }],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
        '<link rel="stylesheet" href="https://x/y.css" media="print">',
      ])
    );
  });

  it('injects JS as deferred scripts before </body>, joined without separators', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, { assets: { css: [], js: ['/a.js', '/b.js'] } });
    expect(result).toContain(
      expectedBody(['<script src="/a.js" defer></script>', '<script src="/b.js" defer></script>'])
    );
  });
});

function expectedHead(parts: string[]): string {
  return [...parts, '</head>'].join('');
}

function expectedBody(parts: string[]): string {
  return [...parts, '\n</body>'].join('');
}
