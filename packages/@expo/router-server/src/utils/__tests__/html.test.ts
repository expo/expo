import {
  createFaviconAsString,
  createInjectedCssAsString,
  createInjectedScriptsAsString,
  createLoaderDataScriptAsString,
  escapeUnsafeCharacters,
  getHydrationFlagScriptAsString,
  injectAssetsIntoHtml,
  serializeHelmetToHtml,
} from '../html';

describe(escapeUnsafeCharacters, () => {
  it('escapes unsafe HTML and JavaScript characters', () => {
    const input = JSON.stringify({
      '/': {
        dangerous: '<script>alert("XSS")</script>',
        nested: { value: '</script><script>alert("nested")</script>' },
        multiple: '<<<multiple>>>',
        mixed: 'Text with <tag> and </tag>',
        quotes: 'He said "Hello"',
        backslash: 'C:\\Users\\test',
        newline: 'Line 1\nLine 2',
        unicode: '你好世界 🌍',
        ampersand: 'A & B',
        separators: '\u2028\u2029',
      },
    });

    const result = escapeUnsafeCharacters(input);

    expect(result).not.toContain('<script>alert("XSS")</script>');
    expect(result).not.toContain('</script><script>alert("nested")</script>');
    expect(result).toContain('\\u003cscript');
    expect(result).toContain('\\u003c/script\\u003e');
    expect(result).toContain('\\u003c\\u003c\\u003cmultiple');
    expect(result).toContain('\\u003ctag');
    expect(result).toContain('\\u003c/tag\\u003e');
    expect(result).toContain('He said \\"Hello\\"');
    expect(result).toContain('C:\\\\Users\\\\test');
    expect(result).toContain('\\n');
    expect(result).toContain('你好世界');
    expect(result).toContain('A \\u0026 B');
    expect(result).toContain('\\u2028\\u2029');

    const unescapedAngleBrackets = result.match(/[<>]/g);
    expect(unescapedAngleBrackets).toBeNull();
  });
});

describe(createInjectedCssAsString, () => {
  it('returns empty string for empty array', () => {
    expect(createInjectedCssAsString([])).toBe('');
  });

  it('returns preload + stylesheet for a single href', () => {
    expect(createInjectedCssAsString(['/styles/main.css'])).toBe(
      '<link rel="preload" href="/styles/main.css" as="style">\n' +
        '<link rel="stylesheet" href="/styles/main.css">'
    );
  });

  it('returns preload + stylesheet pairs for multiple hrefs', () => {
    const result = createInjectedCssAsString(['/a.css', '/b.css']);
    expect(result).toBe(
      '<link rel="preload" href="/a.css" as="style">\n' +
        '<link rel="stylesheet" href="/a.css">\n' +
        '<link rel="preload" href="/b.css" as="style">\n' +
        '<link rel="stylesheet" href="/b.css">'
    );
  });
});

describe(createInjectedScriptsAsString, () => {
  it('returns empty string for empty array', () => {
    expect(createInjectedScriptsAsString([])).toBe('');
  });

  it('returns a single defer script tag', () => {
    expect(createInjectedScriptsAsString(['/bundle.js'])).toBe(
      '<script src="/bundle.js" defer></script>'
    );
  });

  it('returns multiple defer script tags', () => {
    const result = createInjectedScriptsAsString(['/a.js', '/b.js']);
    expect(result).toBe('<script src="/a.js" defer></script>\n<script src="/b.js" defer></script>');
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

describe(getHydrationFlagScriptAsString, () => {
  it('returns the exact hydration flag script tag', () => {
    expect(getHydrationFlagScriptAsString()).toBe(
      '<script type="module">globalThis.__EXPO_ROUTER_HYDRATE__=true;</script>'
    );
  });
});

describe(createLoaderDataScriptAsString, () => {
  it('returns the expected inline script markup', () => {
    const data = { '/': { foo: 'bar' } };

    expect(createLoaderDataScriptAsString(data)).toBe(
      '<script id="expo-router-data">' +
        'globalThis.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse("{\\"/\\":{\\"foo\\":\\"bar\\"}}");' +
        '</script>'
    );
  });

  it('uses an escaped payload for unsafe HTML input', () => {
    const data = { '/route': '<script>alert("xss")</script>' };
    const result = createLoaderDataScriptAsString(data);

    expect(result).toContain('<script id="expo-router-data">');
    expect(result).toContain('globalThis.__EXPO_ROUTER_LOADER_DATA__');
    expect(result).toContain('JSON.parse(');
    expect(result).toContain(
      '\\\\u003cscript\\\\u003ealert(\\\\\\"xss\\\\\\")\\\\u003c/script\\\\u003e'
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

  it('preserves the original order of bundled and external CSS entries', () => {
    const result = injectAssetsIntoHtml(TEMPLATE, {
      assets: {
        css: [
          { type: 'external', source: '<link rel="stylesheet" href="https://x/y.css">' },
          { type: 'css', href: '/a.css' },
        ],
        js: [],
      },
    });
    expect(result).toContain(
      expectedHead([
        '<link rel="stylesheet" href="https://x/y.css">',
        '<link rel="preload" href="/a.css" as="style">\n<link rel="stylesheet" href="/a.css">',
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

describe(serializeHelmetToHtml, () => {
  it.each([null, undefined])('returns empty strings for %j helmet', () => {
    expect(serializeHelmetToHtml(null)).toEqual({
      headTags: '',
      htmlAttributes: '',
      bodyAttributes: '',
    });
  });

  it('serializes helmet head keys in correct order', () => {
    const helmet = {
      title: { toString: () => '<title>Test</title>' },
      meta: { toString: () => '<meta name="desc" content="test">' },
      link: { toString: () => '<link rel="icon" href="/icon.png">' },
      script: { toString: () => '<script src="/analytics.js"></script>' },
      style: { toString: () => '<style>body{}</style>' },
      priority: { toString: () => '' },
      htmlAttributes: { toString: () => 'lang="en"' },
      bodyAttributes: { toString: () => 'class="dark"' },
    };

    const result = serializeHelmetToHtml(helmet);

    expect(result.headTags).toBe(
      '<title>Test</title>' +
        '<meta name="desc" content="test">' +
        '<link rel="icon" href="/icon.png">' +
        '<script src="/analytics.js"></script>' +
        '<style>body{}</style>'
    );
    expect(result.htmlAttributes).toBe('lang="en"');
    expect(result.bodyAttributes).toBe('class="dark"');
  });

  it('handles helmet with missing keys', () => {
    const helmet = {
      title: { toString: () => '<title>Hello</title>' },
      htmlAttributes: { toString: () => '' },
      bodyAttributes: { toString: () => '' },
    };

    const result = serializeHelmetToHtml(helmet);
    expect(result.headTags).toBe('<title>Hello</title>');
    expect(result.htmlAttributes).toBe('');
    expect(result.bodyAttributes).toBe('');
  });
});

/** Joins the injected `<head>` fragments and the closing `</head>` into the expected substring. */
function expectedHead(parts: string[]): string {
  return [...parts, '</head>'].join('');
}

/** Joins the injected `<body>` fragments and the closing `</body>` into the expected substring. */
function expectedBody(parts: string[]): string {
  return [...parts, '\n</body>'].join('');
}
