import {
  createInjectedCssAsString,
  createInjectedScriptsAsString,
  createLoaderDataScriptAsString,
  escapeUnsafeCharacters,
  getHydrationFlagScriptAsString,
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
