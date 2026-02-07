import {
  checkMarkdownQuality,
  checkPage,
  cleanHtml,
  cleanMarkdown,
  convertHtmlToMarkdown,
  stripCodeBlocks,
} from './generate-markdown-pages-utils.ts';
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

  it('converts terminal blocks with data-md="code-block"', () => {
    const $ = cheerio.load(`<main><div data-md="code-block" class="rounded p-4"><code>npx expo start</code></div></main>`);
    cleanHtml($, $('main'));
    const html = $('main').html();
    expect(html).toContain('<pre>');
    expect(html).toContain('<code class="language-sh">');
    expect(html).toContain('npx expo start');
  });
});

describe('cleanMarkdown', () => {
  it('removes anchor links in headings', () => {
    expect(cleanMarkdown('## Installation[](#installation)')).toBe('## Installation');
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

  it('converts pre>code to fenced code blocks', () => {
    const html = '<main><pre><code class="language-js">const x = 1;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```js\nconst x = 1;\n```');
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
});

describe('card links', () => {
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
});

describe('terminal snippet labels', () => {
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
    expect(md).not.toContain('\\-');
    expect(md).toContain('| - |');
  });
});

describe('orphaned bullet markers', () => {
  it('removes standalone bullet markers on their own line', () => {
    const md = cleanMarkdown('### `Sharing.share()`\n\n \u2022 \n\nShares the content.');
    expect(md).not.toContain(' \u2022 ');
    expect(md).toContain('### `Sharing.share()`');
    expect(md).toContain('Shares the content.');
  });
});

describe('platform badge commas', () => {
  it('strips orphan comma before platform name', () => {
    const md = cleanMarkdown('### Known issues , Android');
    expect(md).toBe('### Known issues Android');
  });

  it('preserves commas between platform names in "Only for:" lists', () => {
    const md = cleanMarkdown('Only for: iOS, Android');
    expect(md).toBe('Only for: iOS, Android');
  });
});

describe('experimental and deprecated badges', () => {
  it('removes bullet separator from badge line', () => {
    const md = cleanMarkdown('### `method()`\nExperimental\u2002\u2022\u2002\nAndroid, iOS');
    expect(md).toContain('Experimental');
    expect(md).not.toContain('\u2022');
    expect(md).toContain('Android, iOS');
  });
});

describe('Default: spacing', () => {
  it('adds space between Default: and backtick value', () => {
    const md = cleanMarkdown("Default:`'weak'`");
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

  it('suppresses exempted warnings when pagePath matches', () => {
    const md = '# Title\n\nShort.';
    expect(checkMarkdownQuality(md).some(w => w.includes('Suspiciously short'))).toBe(true);
    expect(checkMarkdownQuality(md, 'build/index.html').some(w => w.includes('Suspiciously short'))).toBe(false);
  });
});

describe('stripCodeBlocks', () => {
  it('strips fenced code blocks', () => {
    const md = 'before\n\n```js\nconst x = 1;\n```\n\nafter';
    expect(stripCodeBlocks(md)).toBe('before\n\n\n\nafter');
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

  it('detects unbalanced code fences', () => {
    const md = '# Title\n\n```js\nconst x = 1;\n\nMissing closing fence.';
    const errors = checkPage(md);
    expect(errors.some(e => e.includes('Unbalanced code fences'))).toBe(true);
  });
});

describe('collapsible/details', () => {
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

describe('SVG checkmarks in tables', () => {
  it('converts success SVG icons to ✓ text', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Feature</th><th>Supported</th></tr></thead>
        <tbody><tr>
          <td>Caching</td>
          <td><svg class="text-icon-success" viewBox="0 0 24 24"><path d="M0"/></svg></td>
        </tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('| Caching | ✓ |');
  });

  it('converts danger SVG icons to ✗ text', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Feature</th><th>Supported</th></tr></thead>
        <tbody><tr>
          <td>Offline</td>
          <td><svg class="text-icon-danger" viewBox="0 0 24 24"><path d="M0"/></svg></td>
        </tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('| Offline | ✗ |');
  });
});

describe('multi-line table cells', () => {
  it('flattens div-wrapped content in table cells', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Name</th><th>Description</th></tr></thead>
        <tbody><tr>
          <td>timeout</td>
          <td><div>Maximum time in milliseconds.</div></td>
        </tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('| timeout | Maximum time in milliseconds. |');
  });

  it('flattens paragraph-wrapped content in table cells', () => {
    const html = `<main>
      <table>
        <thead><tr><th>Param</th><th>Info</th></tr></thead>
        <tbody><tr>
          <td>url</td>
          <td><p>The URL to open.</p></td>
        </tr></tbody>
      </table>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('| url | The URL to open. |');
  });
});

describe('duplicate platform names in headings', () => {
  it('removes platform badge inside heading with data-md attribute', () => {
    const html = `<main>
      <h3>Android <span>
        <div data-md="platform-badge">
          <svg/><span>Android</span>
        </div>
      </span></h3>
      <p>Content here.</p>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('### Android');
    expect(md).not.toContain('Android Android');
  });
});

describe('snippet headers', () => {
  it('removes snippet headers with data-md="snippet-header"', () => {
    const html = `<main>
      <div>
        <div data-md="snippet-header" class="flex min-h-[40px]">
          <label><span>app.json</span></label>
        </div>
        <pre><code class="language-json">{"expo": {}}</code></pre>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```json');
    expect(md).not.toMatch(/^app\.json$/m);
  });
});

describe('hidden code spans', () => {
  it('removes .code-hidden spans containing placeholder markers', () => {
    const html = `<main><pre><code><span><span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">...</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">import Constants from 'expo-constants';</span></span>
export default function App() {}</code></pre></main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).not.toContain('%%placeholder');
    expect(md).not.toContain('import Constants');
    expect(md).toContain('export default function App() {}');
  });

  it('preserves visible code around hidden spans', () => {
    const html = `<main><pre><code>import React from 'react';
<span class="code-hidden">%%placeholder-start%%</span><span class="code-placeholder">...</span><span class="code-hidden">%%placeholder-end%%</span><span class="code-hidden">import { View } from 'react-native';</span>
export default App;</code></pre></main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain("import React from 'react';");
    expect(md).toContain('export default App;');
    expect(md).not.toContain('%%placeholder');
  });
});

describe('escaped underscores', () => {
  it('unescapes underscores in path names', () => {
    const input = String.raw`Run tests in the \_\_tests\_\_ directory.`;
    const md = cleanMarkdown(input);
    expect(md).toBe('Run tests in the __tests__ directory.');
  });

  it('preserves underscores that are already unescaped', () => {
    const md = cleanMarkdown('Use snake_case naming.');
    expect(md).toBe('Use snake_case naming.');
  });
});

describe('escaped square brackets', () => {
  it('unescapes brackets in file paths', () => {
    const input = String.raw`Navigate to ios/\[app\]/Info.plist`;
    const md = cleanMarkdown(input);
    expect(md).toBe('Navigate to ios/[app]/Info.plist');
  });

  it('preserves brackets that are part of markdown links', () => {
    const md = cleanMarkdown('See [the docs](https://example.com) for details.');
    expect(md).toBe('See [the docs](https://example.com) for details.');
  });
});

describe('blockquote in table cells', () => {
  it('flattens blockquote inside table cell to plain text', () => {
    const html = `<main><table><tr><th>Permission</th><th>Description</th></tr>
      <tr><td>READ_PHONE_STATE</td><td>
        <p>Allows read only access to phone state.</p>
        <blockquote><div><span>Allows read only access to phone state, including PhoneAccounts.</span></div></blockquote>
      </td></tr></table></main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).not.toContain('> Allows');
    expect(md).toContain('Allows read only access to phone state');
  });
});

describe('code block language from data-md-lang', () => {
  it('uses data-md-lang attribute for language tag', () => {
    const html = '<main><pre data-md-lang="tsx"><code>const App = () => null;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```tsx\nconst App = () => null;\n```');
  });

  it('prefers data-md-lang over class-based language', () => {
    const html = '<main><pre data-md-lang="typescript"><code class="language-js">const x = 1;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```typescript\nconst x = 1;\n```');
  });
});
