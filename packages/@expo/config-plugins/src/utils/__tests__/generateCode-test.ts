import { createGeneratedHeaderComment, mergeContents } from '../generateCode';

const src = `
line 1
line 2
line 3
`;

const defaultValuesForTest = {
  src,
  newSrc: 'new line',
  tag: 'MY_TAG',
  anchor: 'line 2',
  comment: '//',
};

describe(mergeContents, () => {
  it('should throw if anchor is not found', () => {
    function willThrow() {
      mergeContents({
        ...defaultValuesForTest,
        anchor: 'NOT_FOUND_ANCHOR',
        offset: 0,
      });
    }
    expect(willThrow).toThrow();
  });

  it('should insert before the found anchor', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 0,
    });
    // ensure the merge went ok
    expect(result.didMerge).toBe(true);
    expect(result.didClear).toBe(false);
    const startTagIndex = result.contents.indexOf(defaultValuesForTest.tag);
    const endTagIndex = result.contents.lastIndexOf(defaultValuesForTest.tag);
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    const newSrcIndex = result.contents.indexOf(defaultValuesForTest.newSrc);
    // ensure tags, anchor and newSrc have been found in the result content
    expect(startTagIndex).not.toBe(-1);
    expect(endTagIndex).not.toBe(-1);
    expect(anchorIndex).not.toBe(-1);
    expect(newSrcIndex).not.toBe(-1);
    // ensure the tags are before the anchor
    expect(startTagIndex < anchorIndex).toBe(true);
    expect(endTagIndex < anchorIndex).toBe(true);
    // ensure newSrc is in between the tags
    expect(startTagIndex < newSrcIndex && newSrcIndex < endTagIndex).toBe(true);
  });

  it('should insert after the found anchor', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 1,
    });
    const startTagIndex = result.contents.indexOf(defaultValuesForTest.tag);
    const endTagIndex = result.contents.lastIndexOf(defaultValuesForTest.tag);
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    const newSrcIndex = result.contents.indexOf(defaultValuesForTest.newSrc);
    // ensure the tags are after the anchor
    expect(startTagIndex > anchorIndex).toBe(true);
    expect(endTagIndex > anchorIndex).toBe(true);
    // ensure newSrc is in between the tags
    expect(startTagIndex < newSrcIndex && newSrcIndex < endTagIndex).toBe(true);
  });

  it('should replace the found anchor with offest 0 and deleteCount 1', () => {
    const initialAnchorIndex = src
      .split('\n')
      .findIndex((line) => line.match(defaultValuesForTest.anchor));
    if (!initialAnchorIndex)
      throw new Error('Something went wrong with the test, the anchor should have been found');
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 0,
      deleteCount: 1,
    });
    const anchorIndex = result.contents.indexOf(defaultValuesForTest.anchor);
    // ensure anchor is not found anymore
    expect(anchorIndex).toBe(-1);
    // ensure line at intial anchor index now is the header comment
    const firstLineOfMerge = result.contents.split('\n')[initialAnchorIndex];
    const { newSrc, tag, comment } = defaultValuesForTest;
    const expectedLine = createGeneratedHeaderComment(newSrc, tag, comment);
    expect(firstLineOfMerge).toBe(expectedLine);
  });

  it('should replace the found anchor with offest 1 and deleteCount 1', () => {
    const result = mergeContents({
      ...defaultValuesForTest,
      offset: 1,
      deleteCount: 1,
    });
    const anchorIndex = result.contents
      .split('\n')
      .findIndex((line) => line.match(defaultValuesForTest.anchor));
    // ensure anchor is still here
    expect(anchorIndex).not.toBe(-1);
    // ensure line after the anchor now is the header comment
    const firstLineOfMerge = result.contents.split('\n')[anchorIndex + 1];
    const { newSrc, tag, comment } = defaultValuesForTest;
    const expectedLine = createGeneratedHeaderComment(newSrc, tag, comment);
    expect(firstLineOfMerge).toBe(expectedLine);
  });
});
