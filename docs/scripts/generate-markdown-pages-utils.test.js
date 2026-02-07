import {
  checkMarkdownQuality,
  checkPage,
  cleanHtml,
  cleanMarkdown,
  convertHtmlToMarkdown,
  stripCodeBlocks,
} from './generate-markdown-pages-utils.js';
import * as cheerio from 'cheerio';

describe('cleanHtml', () => {
  it('removes buttons', () => {
    const $ = cheerio.load('<main><button>Copy</button><p>content</p></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('button');
    expect($('main').text()).toContain('content');
  });

  it('removes SVGs', () => {
    const $ = cheerio.load('<main><svg viewBox="0 0 24 24"><path d="M0 0"/></svg><p>text</p></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('svg');
    expect($('main').text()).toContain('text');
  });

  it('removes "Edit page" links and their parent (text fallback)', () => {
    const $ = cheerio.load('<main><div><a href="https://github.com/edit">Edit page</a></div><p>content</p></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('Edit page');
    expect($('main').text()).toContain('content');
  });

  it('removes "Report an issue" links and their parent (text fallback)', () => {
    const $ = cheerio.load('<main><div><a href="https://github.com/issues">Report an issue</a></div><p>content</p></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('Report an issue');
  });

  it('removes page title buttons via data-md="skip"', () => {
    const $ = cheerio.load(`<main>
      <h1>Title</h1>
      <span data-md="skip">
        <a href="https://github.com/edit">Edit page</a>
        <a href="https://github.com/expo">GitHub</a>
        <a href="https://npmjs.com/package/expo">npm</a>
      </span>
      <p>Real content.</p>
    </main>`);
    cleanHtml($, $('main'));
    expect($('main').text()).not.toContain('Edit page');
    expect($('main').text()).not.toContain('GitHub');
    expect($('main').text()).not.toContain('npm');
    expect($('main').text()).toContain('Real content.');
  });

  it('removes .select-none elements', () => {
    const $ = cheerio.load('<main><span class="select-none">$ </span><code>npm install</code></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('select-none');
    expect($('main').text()).toContain('npm install');
    expect($('main').text()).not.toContain('$ ');
  });

  it('converts terminal blocks (bg-palette-black) to pre>code', () => {
    const $ = cheerio.load(`<main><div class="rounded bg-palette-black p-4"><code>npx expo start</code></div></main>`);
    cleanHtml($, $('main'));
    const html = $('main').html();
    expect(html).toContain('<pre>');
    expect(html).toContain('<code class="language-sh">');
    expect(html).toContain('npx expo start');
  });

  it('converts terminal blocks with data-md="code-block"', () => {
    const $ = cheerio.load(`<main><div data-md="code-block" class="rounded p-4"><code>npx expo start</code></div></main>`);
    cleanHtml($, $('main'));
    const html = $('main').html();
    expect(html).toContain('<pre>');
    expect(html).toContain('<code class="language-sh">');
    expect(html).toContain('npx expo start');
  });

  it('joins multiple code elements in terminal blocks', () => {
    const $ = cheerio.load(`<main><div class="bg-palette-black"><code>line 1</code><code>line 2</code></div></main>`);
    cleanHtml($, $('main'));
    const html = $('main').html();
    expect(html).toContain('line 1\nline 2');
  });

  it('removes elements with data-md="skip"', () => {
    const $ = cheerio.load('<main><code data-md="skip">$ </code><code>npm install</code></main>');
    cleanHtml($, $('main'));
    expect($('main').text()).toContain('npm install');
    expect($('main').text()).not.toContain('$ ');
  });
});

describe('cleanMarkdown', () => {
  it('removes anchor links in headings', () => {
    expect(cleanMarkdown('## Installation[](#installation)')).toBe('## Installation');
  });

  it('removes anchor links in deeply nested headings', () => {
    expect(cleanMarkdown('#### API Reference[](#api-reference)')).toBe('#### API Reference');
  });

  it('removes empty links (leftover from icon-only links)', () => {
    expect(cleanMarkdown('Some text [](https://github.com/expo/expo) more text')).toBe(
      'Some text  more text'
    );
  });

  it('removes standalone horizontal rules', () => {
    expect(cleanMarkdown('before\n\n* * *\n\nafter')).toBe('before\n\nafter');
  });

  it('collapses excessive newlines', () => {
    expect(cleanMarkdown('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trims whitespace', () => {
    expect(cleanMarkdown('  \n\ncontent\n\n  ')).toBe('content');
  });

  it('handles multiple cleanups together', () => {
    const input = '## Title[](#title)\n\n\n\n[](http://example.com)\n\n* * *\n\ncontent';
    const result = cleanMarkdown(input);
    expect(result).toBe('## Title\n\ncontent');
  });
});

describe('convertHtmlToMarkdown', () => {
  it('returns null for HTML without <main>', () => {
    expect(convertHtmlToMarkdown('<html><body><div>no main</div></body></html>')).toBeNull();
  });

  it('returns null for empty <main>', () => {
    expect(convertHtmlToMarkdown('<html><body><main></main></body></html>')).toBeNull();
  });

  it('converts a simple page', () => {
    const html = `
      <html><body>
        <header><nav>Navigation</nav></header>
        <main>
          <h1>Hello World</h1>
          <p>This is a paragraph.</p>
        </main>
        <footer>Footer</footer>
      </body></html>
    `;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Hello World');
    expect(md).toContain('This is a paragraph.');
    expect(md).not.toContain('Navigation');
    expect(md).not.toContain('Footer');
  });

  it('converts headings to ATX style', () => {
    const html = '<main><h1>H1</h1><h2>H2</h2><h3>H3</h3></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# H1');
    expect(md).toContain('## H2');
    expect(md).toContain('### H3');
  });

  it('converts links', () => {
    const html = '<main><a href="/docs/intro">Introduction</a></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Introduction](/docs/intro)');
  });

  it('converts pre>code to fenced code blocks', () => {
    const html = '<main><pre><code class="language-js">const x = 1;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```js\nconst x = 1;\n```');
  });

  it('converts pre>code without language to plain fenced blocks', () => {
    const html = '<main><pre><code>plain code</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```\nplain code\n```');
  });

  it('removes images', () => {
    const html = '<main><p>Before</p><img src="/static/img/screenshot.png" alt="screenshot"/><p>After</p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Before');
    expect(md).toContain('After');
    expect(md).not.toContain('screenshot');
    expect(md).not.toContain('img');
  });

  it('removes buttons and SVGs', () => {
    const html = `<main>
      <p>Content</p>
      <button>Copy to clipboard</button>
      <svg viewBox="0 0 24 24"><path d="M0"/></svg>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Content');
    expect(md).not.toContain('Copy');
    expect(md).not.toContain('svg');
  });

  it('strips Edit page links', () => {
    const html = `<main>
      <h1>Title</h1>
      <span><a href="https://github.com/expo/expo/edit/main/docs/foo.mdx">Edit page</a></span>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).not.toContain('Edit page');
  });

  it('converts terminal-style blocks to fenced sh code', () => {
    const html = `<main>
      <div class="rounded-b-md bg-palette-black p-4">
        <span class="select-none">$ </span><code>npx create-expo-app@latest</code>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```sh\nnpx create-expo-app@latest\n```');
  });

  it('converts tables with GFM', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Name</th><th>Type</th></tr></thead>
        <tbody><tr><td>foo</td><td>string</td></tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('| Name | Type |');
    expect(md).toContain('| foo | string |');
  });

  it('converts unordered lists with dash markers', () => {
    const html = '<main><ul><li>Item 1</li><li>Item 2</li></ul></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('-   Item 1');
    expect(md).toContain('-   Item 2');
  });

  it('cleans heading anchor fragments', () => {
    const html = '<main><h2>Installation<a href="#installation"></a></h2></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Installation');
    expect(md).not.toContain('[](#installation)');
  });

  it('ends with a trailing newline', () => {
    const html = '<main><p>Content</p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toMatch(/\n$/);
  });
});

describe('card links', () => {
  it('converts card links to inline markdown links', () => {
    const html = `<main>
      <p>Get started with the following guide:</p>
      <a href="/eas-insights/introduction">
        <div class="flex flex-row gap-4">
          <div class="flex items-center justify-center">
            <svg viewBox="0 0 24 24"><path/></svg>
          </div>
          <div class="flex flex-col">
            <span data-text="true">EAS Insights</span>
            <p data-text="true">Learn how to use EAS Insights to monitor your app.</p>
          </div>
        </div>
        <svg viewBox="0 0 16 16"><path/></svg>
      </a>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[EAS Insights](/eas-insights/introduction)');
    expect(md).toContain('Learn how to use EAS Insights to monitor your app.');
    // Should not have the ugly multi-line link format
    expect(md).not.toMatch(/\[\s*\n/);
  });

  it('converts card links with data-md="card-link"', () => {
    const html = `<main>
      <a href="/guide" data-md="card-link">
        <div class="flex flex-row gap-4">
          <div class="flex flex-col">
            <span data-text="true">My Guide</span>
            <p data-text="true">Guide description.</p>
          </div>
        </div>
      </a>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[My Guide](/guide)');
    expect(md).toContain('Guide description.');
  });

  it('converts multiple card links on same page', () => {
    const html = `<main>
      <a href="/guide-a">
        <div class="flex flex-row gap-4">
          <div><svg/></div>
          <div class="flex flex-col">
            <span data-text="true">Guide A</span>
            <p data-text="true">Description A</p>
          </div>
        </div>
      </a>
      <a href="/guide-b">
        <div class="flex flex-row gap-4">
          <div><svg/></div>
          <div class="flex flex-col">
            <span data-text="true">Guide B</span>
            <p data-text="true">Description B</p>
          </div>
        </div>
      </a>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Guide A](/guide-a)');
    expect(md).toContain('[Guide B](/guide-b)');
    expect(md).toContain('Description A');
    expect(md).toContain('Description B');
  });
});

describe('terminal snippet labels', () => {
  it('removes the "Terminal" label from terminal-snippet containers', () => {
    const html = `<main>
      <div class="terminal-snippet">
        <div class="flex min-h-[40px] justify-between border border-default bg-default rounded-t-md">
          <span data-text="true"><span class="break-words">Terminal</span></span>
        </div>
        <div class="bg-palette-black p-4"><code>npx expo start</code></div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```sh\nnpx expo start\n```');
    expect(md).not.toMatch(/^Terminal$/m);
  });

  it('removes filename labels from code snippet containers', () => {
    const html = `<main>
      <div class="terminal-snippet">
        <div class="flex min-h-[40px] justify-between border border-default bg-default rounded-t-md">
          <span data-text="true"><span class="break-words">app.json</span></span>
        </div>
        <pre><code class="language-json">{"expo": {}}</code></pre>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```json');
    expect(md).not.toMatch(/^app\.json$/m);
  });

  it('removes labels using data-md="terminal"', () => {
    const html = `<main>
      <div data-md="terminal">
        <div class="flex min-h-[40px] justify-between">
          <span>Terminal</span>
        </div>
        <div data-md="code-block"><code>npx expo start</code></div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```sh\nnpx expo start\n```');
    expect(md).not.toMatch(/^Terminal$/m);
  });
});

describe('step numbers', () => {
  it('removes orphaned step numbers before headings', () => {
    const html = `<main>
      <div class="mb-8 mt-6 flex gap-4">
        <p class="font-medium text-base text-secondary mt-1 flex h-7 min-w-[28px] items-center justify-center">1</p>
        <div class="w-full">
          <h2 data-heading="true">Install the library</h2>
          <p>Run the following command.</p>
        </div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Install the library');
    expect(md).toContain('Run the following command.');
    expect(md).not.toMatch(/^1$/m);
  });

  it('removes step numbers using data-md="step" and data-md="step-content"', () => {
    const html = `<main>
      <div data-md="step" class="mb-8 mt-6 flex gap-4">
        <p class="font-medium">1</p>
        <div data-md="step-content" class="w-full">
          <h2>Install the library</h2>
          <p>Run the following command.</p>
        </div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Install the library');
    expect(md).toContain('Run the following command.');
    expect(md).not.toMatch(/^1$/m);
  });
});

describe('platform indicators', () => {
  it('preserves platform text in "Only for:" indicators', () => {
    const html = `<main>
      <div class="mb-2 inline-flex empty:hidden">
        <span data-text="true">
          <span class="text-xs font-medium text-tertiary">Only for: </span>
          <div class="select-none rounded-full border bg-palette-blue3">
            <svg viewBox="0 0 24 24"><path/></svg>
            <span class="whitespace-nowrap">iOS</span>
          </div>
        </span>
      </div>
      <p>This feature is iOS only.</p>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Only for: iOS');
    expect(md).toContain('This feature is iOS only.');
  });

  it('handles multiple platform badges', () => {
    const html = `<main>
      <div class="mb-2 inline-flex empty:hidden">
        <span data-text="true">
          <span class="text-xs font-medium text-tertiary">Only for: </span>
          <div class="select-none rounded-full border bg-palette-blue3">
            <svg/><span class="whitespace-nowrap">iOS</span>
          </div>
          <div class="select-none rounded-full border bg-palette-green3">
            <svg/><span class="whitespace-nowrap">Android</span>
          </div>
        </span>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Only for: iOS, Android');
  });

  it('extracts platform text from data-md="platform-badge" elements', () => {
    const html = `<main>
      <div class="mb-2 inline-flex empty:hidden">
        <span data-text="true">
          <span class="text-xs font-medium text-tertiary">Only for: </span>
          <div data-md="platform-badge">
            <svg viewBox="0 0 24 24"><path/></svg>
            <span class="whitespace-nowrap">iOS</span>
          </div>
          <div data-md="platform-badge">
            <svg/><span class="whitespace-nowrap">Android</span>
          </div>
        </span>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Only for: iOS, Android');
  });
});

describe('diff tables', () => {
  it('converts HTML diff tables to code blocks (table.diff fallback)', () => {
    const html = `<main>
      <table class="diff diff-unified">
        <colgroup><col class="diff-gutter-col"><col class="diff-gutter-col"><col></colgroup>
        <tbody class="diff-hunk">
          <tr class="diff-line">
            <td class="diff-gutter diff-gutter-delete">1</td>
            <td class="diff-gutter diff-gutter-delete"></td>
            <td class="diff-code diff-code-delete"><span>- old line</span></td>
          </tr>
          <tr class="diff-line">
            <td class="diff-gutter diff-gutter-insert"></td>
            <td class="diff-gutter diff-gutter-insert">1</td>
            <td class="diff-code diff-code-insert"><span>+ new line</span></td>
          </tr>
        </tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```diff');
    expect(md).toContain('- old line');
    expect(md).toContain('+ new line');
    expect(md).not.toContain('<table');
  });

  it('converts diff tables inside data-md="diff" wrapper', () => {
    const html = `<main>
      <div data-md="diff">
        <table>
          <tbody>
            <tr>
              <td>1</td>
              <td></td>
              <td><span>- removed</span></td>
            </tr>
            <tr>
              <td></td>
              <td>1</td>
              <td><span>+ added</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```diff');
    expect(md).toContain('- removed');
    expect(md).toContain('+ added');
  });
});

describe('placeholder markers', () => {
  it('replaces %%placeholder%% markers with ellipsis', () => {
    const html = `<main><pre><code class="language-json">{
  %%placeholder-start%%... %%placeholder-end%%
  "updates": {}
}</code></pre></main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('...');
    expect(md).not.toContain('%%placeholder');
  });
});

describe('fullwidth characters', () => {
  it('replaces fullwidth equals sign with regular equals', () => {
    const html = '<main><p><code>PermissionStatus.DENIED ＝ "denied"</code></p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('= "denied"');
    expect(md).not.toContain('＝');
  });
});

describe('escaped dashes', () => {
  it('unescapes backslash-dashes in table cells', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
        <tbody><tr><td>isDefault</td><td>boolean</td><td>-</td></tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    // Turndown escapes leading dashes to \- to prevent list interpretation.
    // Our cleanMarkdown should unescape them.
    expect(md).not.toContain('\\-');
    expect(md).toContain('| - |');
  });
});

describe('orphaned bullet markers', () => {
  it('removes standalone bullet markers on their own line', () => {
    const md = cleanMarkdown('### `Sharing.share()`\n\n • \n\nShares the content.');
    expect(md).not.toContain(' • ');
    expect(md).toContain('### `Sharing.share()`');
    expect(md).toContain('Shares the content.');
  });
});

describe('platform badge commas', () => {
  it('strips orphan comma before platform name in headings', () => {
    const md = cleanMarkdown('### Known issues , Android');
    expect(md).toBe('### Known issues Android');
  });

  it('strips orphan comma before platform name in bullet items', () => {
    const md = cleanMarkdown('-   , Android A terminated app will not restart');
    expect(md).toBe('-   Android A terminated app will not restart');
  });

  it('strips orphan comma before platform name in inline text', () => {
    const md = cleanMarkdown('Apple Maps (available on , iOS only).');
    expect(md).toBe('Apple Maps (available on iOS only).');
  });

  it('strips orphan comma before platform name in table cells', () => {
    const md = cleanMarkdown('| `ERR_CODE` | , iOS | User declined |');
    expect(md).toBe('| `ERR_CODE` | iOS | User declined |');
  });

  it('preserves commas between platform names in "Only for:" lists', () => {
    const md = cleanMarkdown('Only for: iOS, Android');
    expect(md).toBe('Only for: iOS, Android');
  });
});

describe('experimental and deprecated badges', () => {
  it('removes bullet separator from Experimental badge line', () => {
    const md = cleanMarkdown('### `method()`\nExperimental\u2002\u2022\u2002\nAndroid, iOS');
    expect(md).toContain('Experimental');
    expect(md).not.toContain('\u2022');
    expect(md).toContain('Android, iOS');
  });

  it('removes bullet separator from Deprecated badge line', () => {
    const md = cleanMarkdown('### `method()`\nDeprecated\u2002\u2022\u2002');
    expect(md).toContain('Deprecated');
    expect(md).not.toContain('\u2022');
  });
});

describe('Default: spacing', () => {
  it('adds space between Default: and backtick value', () => {
    const md = cleanMarkdown("Default:`'weak'`");
    expect(md).toBe("Default: `'weak'`");
  });

  it('does not double-space if already correct', () => {
    const md = cleanMarkdown("Default: `'weak'`");
    expect(md).toBe("Default: `'weak'`");
  });
});

describe('DeprecatedFor run-together', () => {
  it('adds space between sentence-ending period and Deprecated', () => {
    const md = cleanMarkdown('access location at all times.DeprecatedFor apps deployed');
    expect(md).toContain('times. DeprecatedFor');
  });
});

describe('HTML entities in code', () => {
  it('decodes HTML entities in code blocks', () => {
    const html = '<main><pre><code>expo-manifest-filters: &lt;expo-sfv&gt;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('<expo-sfv>');
    expect(md).not.toContain('&lt;');
    expect(md).not.toContain('&gt;');
  });
});

describe('convertHtmlToMarkdown with real page structure', () => {
  it('handles a realistic docs page', () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body>
      <header><nav><a href="/">Home</a><a href="/guides">Guides</a></nav></header>
      <main>
        <div>
          <h1 data-heading="true">Create a project</h1>
          <span>
            <a href="https://github.com/expo/expo/edit/main/docs/pages/foo.mdx">
              <svg viewBox="0 0 24 24"><path/></svg>
              <p>Edit page</p>
            </a>
          </span>
        </div>
        <p>Learn how to create a new Expo project.</p>
        <h2>Prerequisites<a href="#prerequisites"></a></h2>
        <ul>
          <li><a href="https://nodejs.org">Node.js (LTS)</a></li>
        </ul>
        <div class="rounded bg-palette-black p-4">
          <span class="select-none">$ </span>
          <code>npx create-expo-app@latest</code>
        </div>
        <h2>Next step<a href="#next-step"></a></h2>
        <p>Now set up your <a href="/get-started/set-up-your-environment">development environment</a>.</p>
      </main>
      <footer><p>Copyright 2025</p></footer>
    </body></html>`;

    const md = convertHtmlToMarkdown(html);

    // Content is present
    expect(md).toContain('# Create a project');
    expect(md).toContain('Learn how to create a new Expo project.');
    expect(md).toContain('## Prerequisites');
    expect(md).toContain('[Node.js (LTS)](https://nodejs.org)');
    expect(md).toContain('```sh\nnpx create-expo-app@latest\n```');
    expect(md).toContain('## Next step');
    expect(md).toContain('[development environment](/get-started/set-up-your-environment)');

    // Non-content is removed
    expect(md).not.toContain('Home');
    expect(md).not.toContain('Guides');
    expect(md).not.toContain('Edit page');
    expect(md).not.toContain('Copyright');
    expect(md).not.toContain('svg');
    expect(md).not.toContain('$ ');
    expect(md).not.toContain('[](#prerequisites)');
  });
});

describe('checkMarkdownQuality', () => {
  it('returns no warnings for well-formed markdown', () => {
    const md = '# Title\n\nThis is a paragraph with enough content to pass the length check easily.\n\nMore content here to be safe.';
    expect(checkMarkdownQuality(md)).toEqual([]);
  });

  it('warns when no headings are found', () => {
    const md = 'This is a paragraph with no headings but enough content to be long enough for the check.';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toContain('No headings found');
  });

  it('warns when content is suspiciously short', () => {
    const md = '# Title\n\nShort.';
    const warnings = checkMarkdownQuality(md);
    expect(warnings.some(w => w.includes('Suspiciously short'))).toBe(true);
  });

  it('warns when raw HTML tags are present', () => {
    const md = '# Title\n\n<div class="something">content</div>\n\nMore text to pass length check.';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toContain('Contains raw HTML tags (<div> or <span>)');
  });

  it('warns when CSS class names leak into text', () => {
    const md = '# Title\n\nbg-palette-black some content here that is long enough for the length check threshold.';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toContain('Contains CSS class names in text');
  });

  it('does not false-positive on HTML tags inside code blocks', () => {
    const md = '# Real Title\n\nSome content that is long enough to pass the check.\n\n```jsx\n<div className="container">\n  <span>Hello</span>\n</div>\n```';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toEqual([]);
  });

  it('does not false-positive on CSS class names inside code blocks', () => {
    const md = '# Title\n\nSome content that is long enough to pass the check.\n\n```css\n.bg-palette-black { color: white; }\n.select-none { user-select: none; }\n```';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toEqual([]);
  });

  it('still warns about HTML tags outside code blocks even when code blocks exist', () => {
    const md = '# Title\n\n<div>leaked html</div>\n\nEnough content here to pass length.\n\n```jsx\n<div>this is fine</div>\n```';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toContain('Contains raw HTML tags (<div> or <span>)');
  });
});

describe('stripCodeBlocks', () => {
  it('strips fenced code blocks', () => {
    const md = 'before\n\n```js\nconst x = 1;\n```\n\nafter';
    expect(stripCodeBlocks(md)).toBe('before\n\n\n\nafter');
  });

  it('strips multiple code blocks', () => {
    const md = '```\nblock1\n```\n\ntext\n\n```\nblock2\n```';
    expect(stripCodeBlocks(md)).toBe('\n\ntext\n\n');
  });

  it('preserves text outside code blocks', () => {
    const md = '# Title\n\nParagraph text.\n\n```\ncode\n```\n\nMore text.';
    const result = stripCodeBlocks(md);
    expect(result).toContain('# Title');
    expect(result).toContain('Paragraph text.');
    expect(result).toContain('More text.');
    expect(result).not.toContain('code');
  });

  it('handles markdown with no code blocks', () => {
    const md = '# Title\n\nJust text.';
    expect(stripCodeBlocks(md)).toBe(md);
  });
});

describe('checkPage (check-markdown-pages)', () => {
  it('returns no errors for well-formed markdown', () => {
    const md = '# Title\n\nThis is valid content with enough text to pass all checks.\n\nMore content here.';
    expect(checkPage(md)).toEqual([]);
  });

  it('detects empty files', () => {
    expect(checkPage('')).toEqual(['Empty file']);
    expect(checkPage('   \n\n  ')).toEqual(['Empty file']);
  });

  it('detects missing headings', () => {
    const md = 'This is a paragraph without any headings but with enough content.';
    const errors = checkPage(md);
    expect(errors).toContain('No headings found');
  });

  it('detects raw HTML tags in prose', () => {
    const md = '# Title\n\n<div class="something">leaked</div>\n\nMore content here.';
    const errors = checkPage(md);
    expect(errors).toContain('Contains raw HTML tags');
  });

  it('does not flag HTML tags inside code blocks', () => {
    const md = '# Title\n\nSome content.\n\n```jsx\n<div className="container">\n  <span>Hello</span>\n</div>\n```';
    expect(checkPage(md)).toEqual([]);
  });

  it('detects CSS class names in prose', () => {
    const md = '# Title\n\nbg-palette-black leaked into text.\n\nMore content.';
    const errors = checkPage(md);
    expect(errors).toContain('Contains CSS class names in text');
  });

  it('does not flag CSS class names inside code blocks', () => {
    const md = '# Title\n\nSome content.\n\n```css\n.terminal-snippet { display: block; }\n```';
    expect(checkPage(md)).toEqual([]);
  });

  it('detects unbalanced code fences', () => {
    const md = '# Title\n\n```js\nconst x = 1;\n\nMissing closing fence.';
    const errors = checkPage(md);
    expect(errors.some(e => e.includes('Unbalanced code fences'))).toBe(true);
  });

  it('passes with balanced code fences', () => {
    const md = '# Title\n\n```js\nconst x = 1;\n```\n\n```sh\nnpm install\n```';
    expect(checkPage(md)).toEqual([]);
  });
});

describe('collapsible/details', () => {
  it('converts details/summary to markdown', () => {
    const html = `<main>
      <h1>Guide</h1>
      <details class="mb-3 rounded-md border border-default bg-default">
        <summary class="group cursor-pointer rounded-md bg-subtle p-1.5">
          <div class="ml-1.5 mr-2"><svg viewBox="0 0 24 24"><path/></svg></div>
          <span class="font-medium">Additional information</span>
          <a href="#additional-information"><svg/></a>
          <div></div>
        </summary>
        <div class="overflow-hidden">
          <div class="px-5 py-4">
            <p>This is the collapsible content with details.</p>
          </div>
        </div>
      </details>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Guide');
    expect(md).toContain('Additional information');
    expect(md).toContain('collapsible content with details');
  });

  it('converts collapsible with data-md="collapsible"', () => {
    const html = `<main>
      <h1>Guide</h1>
      <details data-md="collapsible">
        <summary>
          <span class="font-medium" data-text="true">How to configure</span>
        </summary>
        <div class="overflow-hidden">
          <div class="px-5 py-4">
            <p>Configuration details here.</p>
          </div>
        </div>
      </details>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('How to configure');
    expect(md).toContain('Configuration details here.');
  });

  it('preserves code blocks inside collapsibles', () => {
    const html = `<main>
      <h1>Guide</h1>
      <details>
        <summary><span>Show example</span></summary>
        <div><div>
          <pre><code class="language-js">const x = 1;</code></pre>
        </div></div>
      </details>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Show example');
    expect(md).toContain('```js\nconst x = 1;\n```');
  });
});

describe('tabs', () => {
  it('converts tab panels to markdown content', () => {
    const html = `<main>
      <h1>Installation</h1>
      <div class="my-4 rounded-md border border-default" data-reach-tabs="">
        <div class="flex flex-wrap gap-1 border-b" data-reach-tab-list="" role="tablist">
          <button role="tab" data-reach-tab="" aria-selected="true">
            <div class="flex items-center gap-2 px-4 py-1.5">
              <p class="font-medium" data-text="true">npm</p>
            </div>
          </button>
          <button role="tab" data-reach-tab="" aria-selected="false">
            <div class="flex items-center gap-2 px-4 py-1.5">
              <p class="font-medium" data-text="true">yarn</p>
            </div>
          </button>
        </div>
        <div data-reach-tab-panels="">
          <div role="tabpanel" data-reach-tab-panel="" class="px-5 py-4">
            <pre><code class="language-sh">npm install expo</code></pre>
          </div>
        </div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Installation');
    // Tab buttons are removed (they're <button> elements)
    // Active panel content is preserved
    expect(md).toContain('npm install expo');
  });
});

describe('callouts/blockquotes', () => {
  it('converts info callout to blockquote', () => {
    const html = `<main>
      <h1>Setup</h1>
      <blockquote class="mb-4 flex gap-2.5 rounded-md border border-info bg-info" data-testid="callout-container">
        <svg class="mt-1 select-none icon-sm text-info"><path/></svg>
        <div class="w-full leading-normal text-default">
          <p data-text="true">This is an informational note about the setup process.</p>
        </div>
      </blockquote>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Setup');
    expect(md).toContain('informational note about the setup process');
    // SVG icon should be removed
    expect(md).not.toContain('svg');
  });

  it('converts callout with data-md="callout"', () => {
    const html = `<main>
      <h1>Guide</h1>
      <blockquote data-md="callout">
        <svg class="select-none"><path/></svg>
        <div>
          <p data-text="true">Important: always back up your data before upgrading.</p>
        </div>
      </blockquote>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('always back up your data before upgrading');
    expect(md).not.toContain('svg');
  });

  it('converts warning callout to blockquote', () => {
    const html = `<main>
      <h1>Guide</h1>
      <blockquote class="mb-4 flex gap-2.5 rounded-md border border-warning bg-warning" data-testid="callout-container">
        <svg class="mt-1 select-none icon-sm text-warning"><path/></svg>
        <div class="w-full leading-normal text-default">
          <p data-text="true">Warning: this action is irreversible and may cause data loss.</p>
        </div>
      </blockquote>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Warning: this action is irreversible');
    expect(md).not.toContain('svg');
  });

  it('preserves code inside callouts', () => {
    const html = `<main>
      <h1>Guide</h1>
      <blockquote class="mb-4 flex gap-2.5 rounded-md border border-default bg-subtle" data-testid="callout-container">
        <svg class="mt-1 select-none icon-sm"><path/></svg>
        <div class="w-full">
          <p data-text="true">Run <code>npx expo start</code> to begin.</p>
        </div>
      </blockquote>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('`npx expo start`');
    expect(md).toContain('Run');
  });
});
