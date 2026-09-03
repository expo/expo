import { getMarkdownHref, getMarkdownUrl, rewriteDocsLinksToMarkdown } from './shared.js';

describe('getMarkdownHref', () => {
  it('converts docs page hrefs to sibling markdown hrefs', () => {
    expect(getMarkdownHref('/get-started/create-a-project/')).toBe(
      '/get-started/create-a-project.md'
    );
    expect(getMarkdownHref('/versions/latest/sdk/filesystem#installation')).toBe(
      '/versions/latest/sdk/filesystem.md#installation'
    );
    expect(getMarkdownHref('/search?query=updates')).toBe('/search.md?query=updates');
    expect(getMarkdownHref('/')).toBe('/index.md');
  });

  it('converts versioned page hrefs whose last segment ends in a number', () => {
    expect(getMarkdownHref('/versions/v51.0.0')).toBe('/versions/v51.0.0.md');
    expect(getMarkdownHref('/versions/v51.0.0/')).toBe('/versions/v51.0.0.md');
  });

  it('preserves non-page hrefs', () => {
    expect(getMarkdownHref('/llms.txt')).toBe('/llms.txt');
    expect(getMarkdownHref('/get-started/create-a-project.md')).toBe(
      '/get-started/create-a-project.md'
    );
    expect(getMarkdownHref('#installation')).toBe('#installation');
  });
});

describe('getMarkdownUrl', () => {
  it('converts docs page hrefs to absolute markdown URLs', () => {
    expect(getMarkdownUrl('/get-started/create-a-project/')).toBe(
      'https://docs.expo.dev/get-started/create-a-project.md'
    );
  });
});

describe('rewriteDocsLinksToMarkdown', () => {
  it('rewrites internal markdown links to markdown page targets', () => {
    const content = [
      '[Create a project](/get-started/create-a-project/)',
      '[Files](https://docs.expo.dev/versions/latest/sdk/filesystem/#usage)',
      '[Titled](/guides/overview/ "Guides overview")',
      '[llms](/llms.txt)',
      '[External](https://expo.dev)',
    ].join('\n');

    expect(rewriteDocsLinksToMarkdown(content)).toBe(
      [
        '[Create a project](/get-started/create-a-project.md)',
        '[Files](https://docs.expo.dev/versions/latest/sdk/filesystem.md#usage)',
        '[Titled](/guides/overview.md "Guides overview")',
        '[llms](/llms.txt)',
        '[External](https://expo.dev)',
      ].join('\n')
    );
  });

  it('does not rewrite links inside fenced code blocks', () => {
    const content = [
      '[Outside](/get-started/create-a-project/)',
      '```md',
      '[Inside](/get-started/create-a-project/)',
      '```',
    ].join('\n');

    expect(rewriteDocsLinksToMarkdown(content)).toBe(
      [
        '[Outside](/get-started/create-a-project.md)',
        '```md',
        '[Inside](/get-started/create-a-project/)',
        '```',
      ].join('\n')
    );
  });

  it('does not rewrite links inside indented or tilde fenced code blocks', () => {
    const content = [
      '1. Step one:',
      '   ```md',
      '   [Indented](/get-started/create-a-project/)',
      '   ```',
      '~~~md',
      '[Tilde](/get-started/create-a-project/)',
      '~~~',
      '[Outside](/get-started/create-a-project/)',
    ].join('\n');

    expect(rewriteDocsLinksToMarkdown(content)).toBe(
      [
        '1. Step one:',
        '   ```md',
        '   [Indented](/get-started/create-a-project/)',
        '   ```',
        '~~~md',
        '[Tilde](/get-started/create-a-project/)',
        '~~~',
        '[Outside](/get-started/create-a-project.md)',
      ].join('\n')
    );
  });

  it('does not let a ``` line close a ~~~ fenced block', () => {
    const content = ['~~~md', '```', '[Inside](/get-started/create-a-project/)', '~~~'].join('\n');

    expect(rewriteDocsLinksToMarkdown(content)).toBe(content);
  });
});
