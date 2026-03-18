import {
  createInjectedCssElements,
  createInjectedScriptElements,
  createLoaderDataScript,
  getHydrationFlagScript,
  serializeHelmetToHtml,
} from '../html';

describe(createInjectedCssElements, () => {
  it('returns empty string for empty array', () => {
    expect(createInjectedCssElements([])).toBe('');
  });

  it('returns preload + stylesheet for a single href', () => {
    expect(createInjectedCssElements(['/styles/main.css'])).toBe(
      '<link rel="preload" href="/styles/main.css" as="style">\n' +
        '<link rel="stylesheet" href="/styles/main.css">'
    );
  });

  it('returns preload + stylesheet pairs for multiple hrefs', () => {
    const result = createInjectedCssElements(['/a.css', '/b.css']);
    expect(result).toBe(
      '<link rel="preload" href="/a.css" as="style">\n' +
        '<link rel="stylesheet" href="/a.css">\n' +
        '<link rel="preload" href="/b.css" as="style">\n' +
        '<link rel="stylesheet" href="/b.css">'
    );
  });
});

describe(createInjectedScriptElements, () => {
  it('returns empty string for empty array', () => {
    expect(createInjectedScriptElements([])).toBe('');
  });

  it('returns a single defer script tag', () => {
    expect(createInjectedScriptElements(['/bundle.js'])).toBe(
      '<script src="/bundle.js" defer></script>'
    );
  });

  it('returns multiple defer script tags', () => {
    const result = createInjectedScriptElements(['/a.js', '/b.js']);
    expect(result).toBe('<script src="/a.js" defer></script>\n<script src="/b.js" defer></script>');
  });
});

describe(getHydrationFlagScript, () => {
  it('returns the exact hydration flag script tag', () => {
    expect(getHydrationFlagScript()).toBe(
      '<script type="module">globalThis.__EXPO_ROUTER_HYDRATE__=true;</script>'
    );
  });
});

describe(createLoaderDataScript, () => {
  it('returns a script tag with double-serialized JSON', () => {
    const data = { '/route': { message: 'hello' } };
    const result = createLoaderDataScript(data);
    expect(result).toContain('<script id="expo-router-data">');
    expect(result).toContain('globalThis.__EXPO_ROUTER_LOADER_DATA__');
    expect(result).toContain('JSON.parse(');
    expect(result).toContain('</script>');
  });

  it('escapes unsafe HTML characters', () => {
    const data = { '/route': '<script>alert("xss")</script>' };
    const result = createLoaderDataScript(data);
    // Should not contain raw `<` or `>` inside the JSON
    expect(result).not.toMatch(/JSON\.parse\([^)]*<script>/);
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
