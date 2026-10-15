import { mergeContents, removeContents, removeGeneratedContents } from '../generateCode';

describe.each([
  ['LF', '\n'],
  ['CRLF', '\r\n'],
])('%s line endings', (_, eol) => {
  const tag = 'expo-updates';

  function checkOutWithLineEndings(contents: string) {
    return contents.replace(/\r?\n/g, eol);
  }

  function mergeAsync(src: string, newSrc: string) {
    return mergeContents({
      src: checkOutWithLineEndings(src),
      newSrc,
      tag,
      anchor: /pod 'ExpoModulesCore'/,
      offset: 1,
      comment: '#',
    });
  }

  const src = [`pod 'ExpoModulesCore'`, `pod 'Other'`].join(eol);

  it('replaces the previously generated contents', () => {
    const firstMerge = mergeAsync(src, `pod 'EXUpdates'`);
    const secondMerge = mergeAsync(firstMerge.contents, `pod 'EXUpdates', :path => '.'`);

    expect(secondMerge.didMerge).toBe(true);
    expect(secondMerge.didClear).toBe(true);
    expect(secondMerge.contents.match(/@generated begin expo-updates/g)).toHaveLength(1);
    expect(secondMerge.contents).not.toContain(`pod 'EXUpdates'${eol}`);
  });

  it('removes the previously generated contents', () => {
    const merged = mergeAsync(src, `pod 'EXUpdates'`);
    const removed = removeContents({ src: checkOutWithLineEndings(merged.contents), tag });

    expect(removed.didClear).toBe(true);
    expect(removed.contents).not.toContain('@generated');
    expect(removed.contents).not.toContain(`pod 'EXUpdates'`);
  });
});

describe(removeGeneratedContents, () => {
  it('should not remove contents from different tags', () => {
    const content = `
// @generated begin foo-bar - expo prebuild (DO NOT MODIFY)
some bar content
// @generated end foo-bar

after bar

// @generated begin foo - expo prebuild (DO NOT MODIFY)
some bar content
// @generated end foo

after foo
`;

    const contentWithoutFoo = `
// @generated begin foo-bar - expo prebuild (DO NOT MODIFY)
some bar content
// @generated end foo-bar

after bar


after foo
`;

    const result = removeGeneratedContents(content, 'foo');
    expect(result).toBe(contentWithoutFoo);
  });
});
