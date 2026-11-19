import { joinWrappedLinkText, rewriteDocsLinksToMarkdown } from './markdown-link-utils.ts';

function toAbsoluteMarkdownLinks(markdown: string): string {
  return rewriteDocsLinksToMarkdown(joinWrappedLinkText(markdown));
}

describe('scene variant links', () => {
  it('rewrites a one-line link to an absolute Markdown URL', () => {
    expect(toAbsoluteMarkdownLinks('Install [Expo CLI](/more/expo-cli/).')).toBe(
      'Install [Expo CLI](https://docs.expo.dev/more/expo-cli.md).'
    );
  });

  it('joins link text that wraps across lines and rewrites the link', () => {
    const markdown = [
      '    Set up [Android Studio and',
      '    Emulator](/workflow/android-studio-emulator/) for Android, [Xcode and iOS',
      '    Simulator](/workflow/ios-simulator/) for iOS.',
    ].join('\n');

    expect(toAbsoluteMarkdownLinks(markdown)).toBe(
      [
        '    Set up [Android Studio and Emulator](https://docs.expo.dev/workflow/android-studio-emulator.md) for Android, [Xcode and iOS Simulator](https://docs.expo.dev/workflow/ios-simulator.md) for iOS.',
      ].join('\n')
    );
  });

  it('leaves a link inside a code fence unchanged', () => {
    const markdown = ['```md', '[wrapped', 'text](/more/expo-cli/)', '```'].join('\n');

    expect(toAbsoluteMarkdownLinks(markdown)).toBe(markdown);
  });
});
