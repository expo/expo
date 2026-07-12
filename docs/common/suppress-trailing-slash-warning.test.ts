import { isTrailingSlashHydrationWarning } from './suppress-trailing-slash-warning';

const HEADER = "A tree hydrated but some attributes of the server rendered HTML didn't match";

function message(...diffLines: string[]) {
  return [HEADER, '', '  <a', ...diffLines.map(line => `    ${line}`), '  >'].join('\n');
}

describe(isTrailingSlashHydrationWarning, () => {
  it('suppresses plain trailing-slash pairs', () => {
    const msg = message('+ href="/guides/overview/"', '- href="/guides/overview"');
    expect(isTrailingSlashHydrationWarning(msg)).toBe(true);
  });

  it('suppresses trailing-slash pairs before a hash', () => {
    const msg = message('+ href="/workflow/foo/#section"', '- href="/workflow/foo#section"');
    expect(isTrailingSlashHydrationWarning(msg)).toBe(true);
  });

  it('suppresses pairs React truncated at shifted offsets', () => {
    const msg = message(
      '+ href="/workflow/upgrading-expo-sdk-walkthrough/#how-to-upgrade-to-the-latest-sdk-v..."',
      '- href="/workflow/upgrading-expo-sdk-walkthrough#how-to-upgrade-to-the-latest-sdk-ve..."'
    );
    expect(isTrailingSlashHydrationWarning(msg)).toBe(true);
  });

  it('suppresses hash links that inherited the query string on the client', () => {
    const msg = message(
      '+ href={"/bare/upgrade/?fromSdk=56&toSdk=57#packagejson"}',
      '- href="/bare/upgrade/#packagejson"'
    );
    expect(isTrailingSlashHydrationWarning(msg)).toBe(true);
  });

  it('does not suppress pairs pointing at different targets', () => {
    const withQuery = message(
      '+ href={"/bare/upgrade/?fromSdk=56&toSdk=57#packagejson"}',
      '- href="/bare/upgrade/#dependencies"'
    );
    expect(isTrailingSlashHydrationWarning(withQuery)).toBe(false);

    const differentPaths = message('+ href="/guides/overview/"', '- href="/guides/routing"');
    expect(isTrailingSlashHydrationWarning(differentPaths)).toBe(false);
  });

  it('does not suppress truncated pairs with different prefixes', () => {
    const msg = message('+ href="/workflow/aaa..."', '- href="/workflow/bbb..."');
    expect(isTrailingSlashHydrationWarning(msg)).toBe(false);
  });

  it('does not suppress the hard hydration failure', () => {
    const msg = [
      "Hydration failed because the server rendered HTML didn't match the client.",
      '+ href="/guides/overview/"',
      '- href="/guides/overview"',
    ].join('\n');
    expect(isTrailingSlashHydrationWarning(msg)).toBe(false);
  });

  it('does not suppress messages with unmatched href counts', () => {
    const msg = message('+ href="/guides/overview/"');
    expect(isTrailingSlashHydrationWarning(msg)).toBe(false);
  });

  it('does not suppress messages without href diffs', () => {
    expect(isTrailingSlashHydrationWarning(message('+ <span className="flex">'))).toBe(false);
  });
});
