import * as cheerio from 'cheerio';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  checkMarkdownQuality,
  checkPage,
  cleanHtml,
  cleanMarkdown,
  convertHtmlToMarkdown,
  convertMdxInstructionToMarkdown,
  extractFrontmatter,
  findMdxSource,
  stripCodeBlocks,
} from './generate-markdown-pages-utils.ts';

describe('convertMdxInstructionToMarkdown', () => {
  it('converts scene JSX components and inlines helper MDX', () => {
    const mdx = `
import Helper from './_helper.mdx';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';

<BuildEnvironmentSwitch />

## Set up root

<Helper />

<Step label="1">
<Terminal cmd={['$ npm install -g eas-cli', '', '# comment', 'echo done']} />
</Step>

<div className="wrapper">
  <QRCodeReact value="https://example.dev/download" size={228} />
</div>

Press <kbd>Y</kbd> when prompted.

<ContentSpotlight alt="ignored" src="/image.png" />
`;

    const helperMdx = `
import { Tabs, Tab } from '~/ui/components/Tabs';
import { Collapsible } from '~/ui/components/Collapsible';

<Tabs>
  <Tab label="macOS">
    <Collapsible summary="Troubleshooting">Helper details</Collapsible>
  </Tab>
  <Tab label="Windows">
    Helper on Windows
  </Tab>
</Tabs>
`;

    const markdown = convertMdxInstructionToMarkdown(
      mdx,
      (importPath, fromPath) => {
        if (importPath === './_helper.mdx' && fromPath === '/tmp/root.mdx') {
          return { content: helperMdx, resolvedPath: '/tmp/_helper.mdx' };
        }
        return null;
      },
      { fromPath: '/tmp/root.mdx' }
    );

    expect(markdown).toContain('## Set up root');
    expect(markdown).toContain('#### macOS');
    expect(markdown).toContain('**Troubleshooting**');
    expect(markdown).toContain('```sh\nnpm install -g eas-cli\necho done\n```');
    expect(markdown).toContain('Download link: [https://example.dev/download]');
    expect(markdown).toContain('Press <kbd>Y</kbd> when prompted.');
    expect(markdown).not.toMatch(
      /<BuildEnvironmentSwitch|<Terminal|<Step|<ContentSpotlight|import\s/
    );
    expect(markdown).not.toContain('# comment');
  });

  it('avoids recursive import loops', () => {
    const files = new Map<string, string>([
      ['/tmp/main.mdx', "import A from './A.mdx';\n\n<A />\n"],
      ['/tmp/A.mdx', "import B from './B.mdx';\n\n## A heading\n\n<B />\n"],
      ['/tmp/B.mdx', "import A from './A.mdx';\n\n## B heading\n\n<A />\n"],
    ]);

    const markdown = convertMdxInstructionToMarkdown(
      files.get('/tmp/main.mdx')!,
      (importPath, fromPath) => {
        const parentDir = path.dirname(fromPath ?? '/tmp/main.mdx');
        const resolvedPath = path.resolve(parentDir, importPath);
        const content = files.get(resolvedPath);
        if (!content) {
          return null;
        }
        return { content, resolvedPath };
      },
      { fromPath: '/tmp/main.mdx' }
    );

    expect(markdown).toContain('## A heading\n\n## B heading');
    expect(markdown).not.toMatch(/<A\s*\/>|<B\s*\/>/);
  });
});

describe('cleanHtml', () => {
  it('removes buttons', () => {
    const $ = cheerio.load('<main><button>Copy</button><p>content</p></main>');
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('button');
    expect($('main').text()).toContain('content');
  });

  it('removes SVGs', () => {
    const $ = cheerio.load(
      '<main><svg viewBox="0 0 24 24"><path d="M0 0"/></svg><p>text</p></main>'
    );
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('svg');
    expect($('main').text()).toContain('text');
  });

  it('removes empty divs inside headings after SVG removal', () => {
    const html = [
      '<main>',
      '<h2>',
      '<div class="rounded-lg"><svg viewBox="0 0 24 24"><path/></svg></div>',
      'Launch to app stores',
      '</h2>',
      '</main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    expect($('h2').text().trim()).toBe('Launch to app stores');
    expect($('h2').find('div').length).toBe(0);
  });

  it('converts data-md="link" elements to plain links', () => {
    const html = [
      '<main>',
      '<a data-md="link" href="https://launch.expo.dev/">',
      '<span>Try Launch</span>',
      '</a>',
      '</main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    const result = $('main').html()!;
    expect(result).toContain('<a href="https://launch.expo.dev/">Try Launch</a>');
  });

  it('removes data-md="link" elements with no href', () => {
    const $ = cheerio.load('<main><a data-md="link"><span>No Link</span></a></main>');
    cleanHtml($, $('main'));
    expect($('main').text().trim()).toBe('');
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
    const $ = cheerio.load(
      '<main><span class="select-none">$ </span><code>npm install</code></main>'
    );
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('select-none');
    expect($('main').text()).toContain('npm install');
    expect($('main').text()).not.toContain('$ ');
  });

  it('converts terminal blocks with data-md="code-block"', () => {
    const $ = cheerio.load(
      `<main><div data-md="code-block" class="rounded p-4"><code>npx expo start</code></div></main>`
    );
    cleanHtml($, $('main'));
    const html = $('main').html();
    expect(html).toContain('<pre>');
    expect(html).toContain('<code class="language-sh">');
    expect(html).toContain('npx expo start');
  });

  it('removes <br> tags inside table cells', () => {
    const html = [
      '<main><table><tr>',
      '<td>',
      '<span>Only for: </span>',
      '<div data-md="platform-badge"><svg/><span>iOS</span></div>',
      '<br/>',
      '<p>A string to set the permission message.</p>',
      '</td>',
      '</tr></table></main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    expect($('td').find('br').length).toBe(0);
  });

  it('removes style tags', () => {
    const html = '<main><style>.foo { color: red; }</style><p>content</p></main>';
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    expect($('main').html()).not.toContain('style');
    expect($('main').html()).not.toContain('color');
    expect($('main').text()).toContain('content');
  });

  it('keeps only first tab panel in @reach/tabs groups', () => {
    const html = [
      '<main>',
      '<div data-reach-tabs="">',
      '<div data-reach-tab-panels="">',
      '<div data-reach-tab-panel="" role="tabpanel">',
      '<pre><code class="language-sh">npm install expo</code></pre>',
      '</div>',
      '<div data-reach-tab-panel="" role="tabpanel">',
      '<pre><code class="language-sh">yarn add expo</code></pre>',
      '</div>',
      '</div>',
      '</div>',
      '</main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    expect($('main').text()).toContain('npm install expo');
    expect($('main').text()).not.toContain('yarn add expo');
  });

  it('unwraps non-empty div/span inside headings', () => {
    const html = [
      '<main>',
      '<h2><span class="wrapper"><span class="inner">Fix the error</span></span></h2>',
      '</main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    expect($('h2').text().trim()).toBe('Fix the error');
    expect($('h2').find('div').length).toBe(0);
    expect($('h2').find('span').length).toBe(0);
  });

  it('re-escapes unknown HTML elements in code as angle-bracket text', () => {
    const html = ['<main><p><code>', 'Promise<uint8array></uint8array>', '</code></p></main>'].join(
      ''
    );
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    const result = $('code').html() ?? '';
    expect(result).toContain('&lt;uint8array&gt;');
  });

  it('decodes double-encoded HTML entities in code blocks', () => {
    const html = [
      '<main><pre><code>',
      'filters: &amp;lt;expo-sfv&amp;gt;',
      '</code></pre></main>',
    ].join('');
    const $ = cheerio.load(html);
    cleanHtml($, $('main'));
    const result = $('code').html() ?? '';
    expect(result).toContain('&lt;expo-sfv&gt;');
    expect(result).not.toContain('&amp;');
  });
});

describe('diagram elements', () => {
  it('replaces data-md="diagram" with its alt text', () => {
    const html = `<main>
      <p>The following diagram shows the hierarchy:</p>
      <div data-md="diagram" data-md-alt="withMyPlugin [Config Plugin] → withAndroidPlugin [Plugin Function]">
        <div class="react-flow">node labels and other interactive content</div>
      </div>
      <p>More content below.</p>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```\nwithMyPlugin [Config Plugin]');
    expect(md).toContain('[Plugin Function]\n```');
    expect(md).not.toContain('react-flow');
    expect(md).not.toContain('interactive content');
  });

  it('escapes special HTML characters in diagram alt text', () => {
    const html = `<main>
      <div data-md="diagram" data-md-alt="A <B> & C"></div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('A <B> & C');
    expect(md).not.toContain('&lt;');
    expect(md).not.toContain('&amp;');
  });

  it('removes data-md="diagram" with no alt text', () => {
    const html = `<main>
      <h2>Overview</h2>
      <div data-md="diagram"><div>canvas content</div></div>
      <p>Text after.</p>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).not.toContain('canvas content');
    expect(md).toContain('Text after.');
  });
});

describe('cleanMarkdown', () => {
  it('removes empty headings', () => {
    expect(cleanMarkdown('## Content\n\n## \n\nMore text')).toBe('## Content\n\nMore text');
    expect(cleanMarkdown('###\n\nContent')).toBe('Content');
  });

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
  it('returns fallback message for HTML without <main>', () => {
    const result = convertHtmlToMarkdown('<html><body><div>no main</div></body></html>');
    expect(result).toContain('No content found');
    expect(result).toContain('https://docs.expo.dev/llms.txt');
  });

  it('returns fallback message for empty <main>', () => {
    const result = convertHtmlToMarkdown('<html><body><main></main></body></html>');
    expect(result).toContain('No content found');
    expect(result).toContain('https://docs.expo.dev/llms.txt');
  });

  it('returns redirect pointer for meta refresh pages', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="0; url=/get-started/introduction/"></head><body><div id="__next"></div></body></html>';
    const result = convertHtmlToMarkdown(html);
    expect(result).toContain('/get-started/introduction/');
    expect(result).toContain('https://docs.expo.dev/get-started/introduction/');
    expect(result).toContain('redirects to');
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

  it('converts pre>code to fenced code blocks', () => {
    const html = '<main><pre><code class="language-js">const x = 1;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```js\nconst x = 1;\n```');
  });
});

describe('homepage buttons (data-md="link")', () => {
  it('converts homepage action buttons to markdown links', () => {
    const html = [
      '<main>',
      '<h2>Launch to app stores</h2>',
      '<p>Ship apps with zero config.</p>',
      '<a data-md="link" href="https://launch.expo.dev/">',
      'Try Launch',
      '<svg viewBox="0 0 24 24"><path/></svg>',
      '</a>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Launch to app stores');
    expect(md).toContain('Ship apps with zero config.');
    expect(md).toContain('[Try Launch](https://launch.expo.dev/)');
  });

  it('preserves heading text when icon wrapper div becomes empty after SVG removal', () => {
    const html = [
      '<main>',
      '<h2>',
      '<div class="rounded-lg p-2">',
      '<svg viewBox="0 0 24 24"><path/></svg>',
      '</div>',
      'Launch to app stores',
      '</h2>',
      '<p>Description text.</p>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Launch to app stores');
    expect(md).toContain('Description text.');
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
  it('removes snippet-header and converts code-block inside terminal', () => {
    const html = `<main>
      <div data-md="terminal">
        <div data-md="snippet-header" class="flex min-h-[40px] justify-between">
          <span>Terminal</span>
        </div>
        <div data-md="code-block"><code>npx expo start</code></div>
      </div>
    </main>`;
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```sh\nnpx expo start\n```');
    expect(md).not.toMatch(/^Terminal$/m);
  });

  it('preserves install command from Terminal with prompt prefix', () => {
    const html = [
      '<main>',
      '<div data-md="terminal" class="terminal-snippet">',
      '<div data-md="snippet-header"><span>Terminal</span></div>',
      '<div data-md="code-block" class="bg-palette-black">',
      '<div class="w-fit">',
      '<code data-md="skip" class="select-none">- </code>',
      '<code>npx expo install expo-camera</code>',
      '</div>',
      '</div>',
      '</div>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('npx expo install expo-camera');
    expect(md).not.toContain('Terminal');
    expect(md).not.toContain('- ');
  });

  it('converts tabbed terminal commands from data-md-commands in package manager order', () => {
    const commands = {
      bun: ['$ bun add expo'],
      yarn: ['$ yarn add expo'],
      npm: ['$ npm install expo', '# npm comment'],
      pnpm: ['$ pnpm add expo'],
    };
    const $ = cheerio.load(`<main>
      <div data-md="terminal">
        <div data-md="snippet-header"><span>Terminal</span></div>
        <div data-md="code-block"><code>npm install expo</code></div>
      </div>
    </main>`);
    $('[data-md="terminal"]').attr('data-md-commands', JSON.stringify(commands));

    const md = convertHtmlToMarkdown($.html());
    const npmIndex = md.indexOf('# npm');
    const yarnIndex = md.indexOf('# yarn');
    const pnpmIndex = md.indexOf('# pnpm');
    const bunIndex = md.indexOf('# bun');

    expect(npmIndex).toBeGreaterThan(-1);
    expect(yarnIndex).toBeGreaterThan(npmIndex);
    expect(pnpmIndex).toBeGreaterThan(yarnIndex);
    expect(bunIndex).toBeGreaterThan(pnpmIndex);
    expect(md).toContain('npm install expo');
    expect(md).toContain('yarn add expo');
    expect(md).toContain('pnpm add expo');
    expect(md).toContain('bun add expo');
    expect(md).not.toContain('# npm comment');
  });

  it('skips empty/comment-only manager sections, ignores unknown keys, and preserves angle brackets', () => {
    const commands = {
      npm: ['# only comment', ''],
      pnpm: ['$ pnpm add <package-name>'],
      unknown: ['$ unknown add expo'],
    };
    const $ = cheerio.load(`<main>
      <div data-md="terminal">
        <div data-md="snippet-header"><span>Terminal</span></div>
        <div data-md="code-block"><code>npm install expo</code></div>
      </div>
    </main>`);
    $('[data-md="terminal"]').attr('data-md-commands', JSON.stringify(commands));

    const md = convertHtmlToMarkdown($.html());

    expect(md).toContain('```sh\n# pnpm\npnpm add <package-name>\n```');
    expect(md).not.toContain('# npm');
    expect(md).not.toContain('unknown add expo');
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

describe('platform indicators in table cells', () => {
  it('keeps "Only for: iOS" on same line as description in table cells', () => {
    const html = [
      '<main><table>',
      '<thead><tr><th>Property</th><th>Default</th><th>Description</th></tr></thead>',
      '<tbody><tr>',
      '<td><code>contactsPermission</code></td>',
      '<td><code>"Allow..."</code></td>',
      '<td>',
      '<span>Only for: </span>',
      '<div data-md="platform-badge"><svg/><span>iOS</span></div>',
      '<br/>',
      '<p>A string to set the permission message.</p>',
      '</td>',
      '</tr></tbody>',
      '</table></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    // Should be a single table row, not split across lines
    const lines = md.split('\n').filter(l => l.startsWith('|'));
    const dataRow = lines.find(l => l.includes('contactsPermission'));
    expect(dataRow).toBeDefined();
    expect(dataRow).toContain('iOS');
    expect(dataRow).toContain('permission message');
  });
});

describe('tab panel deduplication', () => {
  it('only includes first tab panel content in output', () => {
    const html = [
      '<main>',
      '<h1>Installation</h1>',
      '<div data-reach-tabs="">',
      '<div data-reach-tab-panels="">',
      '<div data-reach-tab-panel="" role="tabpanel">',
      '<pre><code class="language-sh">npx expo install expo-camera</code></pre>',
      '</div>',
      '<div data-reach-tab-panel="" role="tabpanel">',
      '<pre><code class="language-sh">yarn add expo-camera</code></pre>',
      '</div>',
      '<div data-reach-tab-panel="" role="tabpanel">',
      '<pre><code class="language-sh">bun add expo-camera</code></pre>',
      '</div>',
      '</div>',
      '</div>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('npx expo install expo-camera');
    expect(md).not.toContain('yarn add expo-camera');
    expect(md).not.toContain('bun add expo-camera');
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

  it('infers +/- markers from react-diff-view CSS classes', () => {
    const html = [
      '<main><div data-md="diff"><table class="diff">',
      '<colgroup><col class="diff-gutter-col"/><col class="diff-gutter-col"/><col/></colgroup>',
      '<tr class="diff-line">',
      '<td class="diff-gutter diff-gutter-delete">1</td>',
      '<td class="diff-gutter diff-gutter-delete"></td>',
      '<td class="diff-code diff-code-delete">old line</td>',
      '</tr>',
      '<tr class="diff-line">',
      '<td class="diff-gutter diff-gutter-insert"></td>',
      '<td class="diff-gutter diff-gutter-insert">1</td>',
      '<td class="diff-code diff-code-insert">new line</td>',
      '</tr>',
      '<tr class="diff-line">',
      '<td class="diff-gutter diff-gutter-normal">2</td>',
      '<td class="diff-gutter diff-gutter-normal">2</td>',
      '<td class="diff-code diff-code-normal">unchanged</td>',
      '</tr>',
      '</table></div></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```diff');
    expect(md).toContain('- old line');
    expect(md).toContain('+ new line');
    expect(md).toMatch(/^\s+unchanged$/m);
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
    const md =
      '# Title\n\nThis is a paragraph with enough content to pass the length check easily.\n\nMore content here to be safe.';
    expect(checkMarkdownQuality(md)).toEqual([]);
  });

  it('warns when no headings are found', () => {
    const md =
      'This is a paragraph with no headings but enough content to be long enough for the check.';
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
    const md =
      '# Title\n\nbg-palette-black some content here that is long enough for the length check threshold.';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toContain('Contains CSS class names in text');
  });

  it('does not false-positive on HTML tags inside code blocks', () => {
    const md =
      '# Real Title\n\nSome content that is long enough to pass the check.\n\n```jsx\n<div className="container">\n  <span>Hello</span>\n</div>\n```';
    const warnings = checkMarkdownQuality(md);
    expect(warnings).toEqual([]);
  });

  it('suppresses exempted warnings when pagePath matches', () => {
    const md = '# Title\n\nShort.';
    expect(checkMarkdownQuality(md).some(w => w.includes('Suspiciously short'))).toBe(true);
    expect(
      checkMarkdownQuality(md, 'build/index.html').some(w => w.includes('Suspiciously short'))
    ).toBe(false);
  });
});

describe('stripCodeBlocks', () => {
  it('strips fenced code blocks', () => {
    const md = 'before\n\n```js\nconst x = 1;\n```\n\nafter';
    expect(stripCodeBlocks(md)).toBe('before\n\n\n\nafter');
  });
});

describe('checkPage (check-markdown-pages)', () => {
  it('returns no errors for well-formed markdown', () => {
    const md =
      '# Title\n\nThis is valid content with enough text to pass all checks.\n\nMore content here.';
    expect(checkPage(md)).toEqual([]);
  });

  it('detects empty files', () => {
    expect(checkPage('')).toEqual(['Empty file']);
    expect(checkPage('   \n\n  ')).toEqual(['Empty file']);
  });

  it('detects unbalanced code fences', () => {
    const md = '# Title\n\n```js\nconst x = 1;\n\nMissing closing fence.';
    const errors = checkPage(md);
    expect(errors.some(error => error.includes('Unbalanced code fences'))).toBe(true);
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
});

describe('escaped underscores', () => {
  it('unescapes underscores in path names', () => {
    const input = String.raw`Run tests in the \_\_tests\_\_ directory.`;
    const md = cleanMarkdown(input);
    expect(md).toBe('Run tests in the __tests__ directory.');
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

describe('font-semibold to bold', () => {
  it('converts font-semibold spans to bold text', () => {
    const html = '<main><p><span class="font-semibold">Android</span> only feature.</p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('**Android**');
  });
});

describe('API platform tags', () => {
  it('converts api-platforms to supported platforms text', () => {
    const html = [
      '<main><h1>Camera</h1>',
      '<div data-md="api-platforms" class="mb-3 flex flex-row">',
      '<div data-md="platform-badge"><svg/><span>Android</span></div>',
      '<div data-md="platform-badge"><svg/><span>iOS</span></div>',
      '</div>',
      '<p>Camera API.</p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Supported platforms: Android, iOS');
  });
});

describe('API returns section', () => {
  it('converts api-returns to inline returns text', () => {
    const html = [
      '<main><h3>takePictureAsync()</h3>',
      '<div data-md="api-returns" class="flex flex-row items-start gap-2">',
      '<div class="flex flex-row items-center gap-2">',
      '<svg viewBox="0 0 24 24"><path/></svg>',
      '<span class="text-xs">Returns:</span>',
      '</div>',
      '<code>Promise</code>',
      '</div></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('Returns:');
    expect(md).toMatch(/Returns: .?Promise.?/);
  });
});

describe('API parameter names', () => {
  it('converts api-param-name spans to code formatting', () => {
    const html = [
      '<main><table>',
      '<thead><tr><th>Name</th><th>Type</th></tr></thead>',
      '<tbody><tr>',
      '<td><span data-md="api-param-name" class="font-medium">options</span></td>',
      '<td><code>CameraOptions</code></td>',
      '</tr></tbody>',
      '</table></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toMatch(/`options`/);
  });
});

describe('code elements with links', () => {
  it('unwraps code with a single link so the link renders in markdown', () => {
    const html = [
      '<main><table>',
      '<thead><tr><th>Type</th></tr></thead>',
      '<tbody><tr>',
      '<td><code><a href="#videoquality">VideoQuality</a></code></td>',
      '</tr></tbody>',
      '</table></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('VideoQuality');
    expect(md).toContain('#videoquality');
  });

  it('unwraps code with mixed content and links so links render', () => {
    const html = '<main><p><code>use <a href="#foo">Foo</a> here</code></p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Foo](#foo)');
  });

  it('unwraps complex type signatures with multiple links', () => {
    const html = [
      '<main><p><code>',
      '<span>(</span>',
      '<span>options?: <a href="#scanningoptions">ScanningOptions</a></span>',
      '<span>) =&gt;</span> ',
      '<a href="https://developer.mozilla.org/Promise">Promise</a>',
      '&lt;void&gt;',
      '</code></p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[ScanningOptions](#scanningoptions)');
    expect(md).toContain('[Promise](https://developer.mozilla.org/Promise)');
    expect(md).toContain('<void>');
    // Should NOT have backtick-escaped link syntax
    expect(md).not.toMatch(/`\[/);
  });

  it('unwraps generic return type: Promise<BarcodeScanningResult[]>', () => {
    // Pattern: reference type with typeArguments containing array of reference
    const html = [
      '<main><p><code>',
      '<a href="https://developer.mozilla.org/Promise">Promise</a>',
      '<span>&lt;</span>',
      '<a href="#barcodescanningresult">BarcodeScanningResult[]</a>',
      '<span>&gt;</span>',
      '</code></p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Promise](https://developer.mozilla.org/Promise)');
    expect(md).toContain('[BarcodeScanningResult[]](#barcodescanningresult)');
    expect(md).not.toMatch(/`\[/);
  });

  it('unwraps union of reference types: TypeA | TypeB', () => {
    // Pattern: union of two reference types, both linked
    const html = [
      '<main><p><code>',
      '<a href="#explicitsupported">ExplicitlySupportedDevicePushToken</a>',
      ' | ',
      '<a href="#implicitsupported">ImplicitlySupportedDevicePushToken</a>',
      '</code></p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[ExplicitlySupportedDevicePushToken](#explicitsupported)');
    expect(md).toContain('[ImplicitlySupportedDevicePushToken](#implicitsupported)');
    expect(md).toContain('|');
  });

  it('unwraps callback type: (event: Notification) => void', () => {
    // Pattern: function signature with linked parameter type
    const html = [
      '<main><p><code>',
      '<span>(</span>',
      '<span>event<span>:</span> <a href="#notification">Notification</a></span>',
      '<span>) =&gt;</span> void',
      '</code></p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Notification](#notification)');
    expect(md).toContain('event');
    expect(md).toContain('void');
    expect(md).not.toMatch(/`\[/);
  });

  it('unwraps generic with multiple type arguments: Omit<Type, Keys>', () => {
    // Pattern: generic reference with multiple typeArguments
    const html = [
      '<main><p><code>',
      '<a href="#omit">Omit</a>',
      '<span>&lt;</span>',
      '<a href="#barcodescanningresult">BarcodeScanningResult</a>',
      '<span>, </span>',
      "'bounds' | 'cornerPoints'",
      '<span>&gt;</span>',
      '</code></p></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('[Omit](#omit)');
    expect(md).toContain('[BarcodeScanningResult](#barcodescanningresult)');
    expect(md).not.toMatch(/`\[/);
  });

  it('preserves code elements that have no links', () => {
    const html = '<main><p><code>plainCode</code></p></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toMatch(/`plainCode`/);
  });
});

describe('code block language from data-md-lang', () => {
  it('uses data-md-lang attribute for language tag', () => {
    const html = '<main><pre data-md-lang="tsx"><code>const App = () => null;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```tsx\nconst App = () => null;\n```');
  });

  it('prefers data-md-lang over class-based language', () => {
    const html =
      '<main><pre data-md-lang="typescript"><code class="language-js">const x = 1;</code></pre></main>';
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('```typescript\nconst x = 1;\n```');
  });
});

describe('collapsed headings', () => {
  it('unwraps non-empty span wrappers inside headings', () => {
    const html = [
      '<main>',
      '<h2><span class="text-wrapper"><span>Fix the TypeScript error</span></span></h2>',
      '<p>Details here.</p>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('## Fix the TypeScript error');
  });

  it('unwraps non-empty div inside heading without losing text', () => {
    const html = [
      '<main>',
      '<h3><div class="inline">Custom tabs</div></h3>',
      '<p>Content.</p>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('### Custom tabs');
  });
});

describe('generic type parameters', () => {
  it('preserves angle brackets around unknown elements in code', () => {
    // Simulates cheerio parsing <Uint8Array> as an HTML element
    const html = ['<main><p><code>', 'Promise&lt;Uint8Array&gt;', '</code></p></main>'].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toMatch(/Promise.*Uint8Array/);
  });
});

describe('double-encoded HTML entities', () => {
  it('decodes double-encoded entities in code blocks', () => {
    const html = [
      '<main><pre><code>',
      'expo-manifest-filters: &amp;lt;expo-sfv&amp;gt;',
      '</code></pre></main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('<expo-sfv>');
    expect(md).not.toContain('&amp;');
    expect(md).not.toContain('&lt;');
  });
});

describe('style tag removal', () => {
  it('removes style tags and their CSS content', () => {
    const html = [
      '<main>',
      '<style>.react-flow { display: flex; } .node { padding: 10px; }</style>',
      '<h1>Config Plugins</h1>',
      '<p>Content here.</p>',
      '</main>',
    ].join('');
    const md = convertHtmlToMarkdown(html);
    expect(md).toContain('# Config Plugins');
    expect(md).toContain('Content here.');
    expect(md).not.toContain('react-flow');
    expect(md).not.toContain('display');
    expect(md).not.toContain('padding');
  });
});

describe('findMdxSource', () => {
  const tmpDir = path.join(os.tmpdir(), 'findMdxSource-test-' + Date.now());
  const outDir = path.join(tmpDir, 'out');
  const pagesDir = path.join(tmpDir, 'pages');

  beforeAll(() => {
    // pages/guides/routing.mdx  (direct .mdx file)
    fs.mkdirSync(path.join(pagesDir, 'guides'), { recursive: true });
    fs.writeFileSync(path.join(pagesDir, 'guides/routing.mdx'), '---\ntitle: Routing\n---\n');

    // pages/archive/index.mdx  (index file in directory)
    fs.mkdirSync(path.join(pagesDir, 'archive'), { recursive: true });
    fs.writeFileSync(path.join(pagesDir, 'archive/index.mdx'), '---\ntitle: Archive\n---\n');

    // pages/versions/v55/sdk/camera.mdx  (deeply nested)
    fs.mkdirSync(path.join(pagesDir, 'versions/v55/sdk'), { recursive: true });
    fs.writeFileSync(
      path.join(pagesDir, 'versions/v55/sdk/camera.mdx'),
      '---\ntitle: Camera\n---\n'
    );

    // Create corresponding output directories
    fs.mkdirSync(path.join(outDir, 'guides/routing'), { recursive: true });
    fs.mkdirSync(path.join(outDir, 'archive'), { recursive: true });
    fs.mkdirSync(path.join(outDir, 'versions/v55/sdk/camera'), { recursive: true });
    fs.mkdirSync(path.join(outDir, 'no-source'), { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds direct .mdx file for route', () => {
    const result = findMdxSource(path.join(outDir, 'guides/routing/index.html'), outDir, pagesDir);
    expect(result).toBe(path.join(pagesDir, 'guides/routing.mdx'));
  });

  it('finds index.mdx when direct .mdx does not exist', () => {
    const result = findMdxSource(path.join(outDir, 'archive/index.html'), outDir, pagesDir);
    expect(result).toBe(path.join(pagesDir, 'archive/index.mdx'));
  });

  it('finds deeply nested mdx source', () => {
    const result = findMdxSource(
      path.join(outDir, 'versions/v55/sdk/camera/index.html'),
      outDir,
      pagesDir
    );
    expect(result).toBe(path.join(pagesDir, 'versions/v55/sdk/camera.mdx'));
  });

  it('returns null when no mdx source exists', () => {
    const result = findMdxSource(path.join(outDir, 'no-source/index.html'), outDir, pagesDir);
    expect(result).toBeNull();
  });
});

describe('extractFrontmatter', () => {
  const tmpDir = path.join(os.tmpdir(), 'extractFrontmatter-test-' + Date.now());

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });

    fs.writeFileSync(
      path.join(tmpDir, 'full.mdx'),
      [
        '---',
        'title: Camera',
        'description: A camera component.',
        "platforms: ['android', 'ios']",
        '---',
        '',
        "import Foo from './Foo';",
        '',
      ].join('\n')
    );

    fs.writeFileSync(path.join(tmpDir, 'minimal.mdx'), '---\ntitle: Minimal\n---\n\n# Minimal\n');

    fs.writeFileSync(
      path.join(tmpDir, 'empty-values.mdx'),
      '---\nmodificationDate: \ntitle: Camera\ndescription: A camera.\n---\n\n# Camera\n'
    );

    fs.writeFileSync(
      path.join(tmpDir, 'only-empty.mdx'),
      '---\nmodificationDate: \n---\n\n# Page\n'
    );

    fs.writeFileSync(
      path.join(tmpDir, 'no-frontmatter.mdx'),
      "import Foo from './Foo';\n\n# Hello\n"
    );

    fs.writeFileSync(
      path.join(tmpDir, 'ui-fields.mdx'),
      [
        '---',
        'title: Camera',
        'description: A camera component.',
        'hideTOC: true',
        'maxHeadingDepth: 4',
        'hideFromSearch: true',
        'hideInSidebar: true',
        'sidebar_title: Cam',
        'searchRank: 10',
        'searchPosition: 5',
        'hasVideoLink: true',
        'packageName: expo-camera',
        'isDeprecated: true',
        'isAlpha: true',
        '---',
        '',
        '# Camera',
        '',
      ].join('\n')
    );

    fs.writeFileSync(
      path.join(tmpDir, 'only-ui-fields.mdx'),
      '---\nhideTOC: true\nmaxHeadingDepth: 4\n---\n\n# Page\n'
    );
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('extracts full frontmatter including delimiters', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'full.mdx'));
    expect(result).not.toBeNull();
    expect(result).toContain('title: Camera');
    expect(result).toContain('description: A camera component.');
    expect(result).toContain('platforms:');
    // Should include --- delimiters
    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n$/);
    // Should NOT include content after frontmatter
    expect(result).not.toContain('import');
  });

  it('extracts minimal frontmatter', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'minimal.mdx'));
    expect(result).not.toBeNull();
    expect(result).toContain('title: Minimal');
    expect(result).not.toContain('# Minimal');
  });

  it('strips lines with empty values', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'empty-values.mdx'));
    expect(result).not.toBeNull();
    expect(result).toContain('title: Camera');
    expect(result).toContain('description: A camera.');
    expect(result).not.toContain('modificationDate');
  });

  it('returns null when all frontmatter fields are empty', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'only-empty.mdx'));
    expect(result).toBeNull();
  });

  it('returns null when no frontmatter exists', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'no-frontmatter.mdx'));
    expect(result).toBeNull();
  });

  it('strips UI-only fields and keeps semantic fields', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'ui-fields.mdx'));
    expect(result).not.toBeNull();
    // Semantic fields are preserved
    expect(result).toContain('title: Camera');
    expect(result).toContain('description: A camera component.');
    expect(result).toContain('isDeprecated: true');
    expect(result).toContain('isAlpha: true');
    expect(result).toContain('packageName: expo-camera');
    // UI-only fields are stripped
    expect(result).not.toContain('hideTOC');
    expect(result).not.toContain('maxHeadingDepth');
    expect(result).not.toContain('hideFromSearch');
    expect(result).not.toContain('hideInSidebar');
    expect(result).not.toContain('sidebar_title');
    expect(result).not.toContain('searchRank');
    expect(result).not.toContain('searchPosition');
    expect(result).not.toContain('hasVideoLink');
  });

  it('returns null when all fields are UI-only', () => {
    const result = extractFrontmatter(path.join(tmpDir, 'only-ui-fields.mdx'));
    expect(result).toBeNull();
  });
});
