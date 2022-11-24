import { appendContents, purgeContents } from '../fileContentsUtils';

describe(appendContents, () => {
  it('should append sectioned contents to the end of file for no existing section', () => {
    const src = `\
# line-1
# line-2`;
    const newContents = appendContents(src, 'test appending contents', {
      tag: 'test-tag',
      commentPrefix: '#',
    });
    expect(newContents).toMatchInlineSnapshot(`
      "# line-1
      # line-2
      # @generated begin test-tag - expo prebuild (DO NOT MODIFY)
      test appending contents
      # @generated end test-tag"
    `);
  });

  it('should append contents to the end of existing section', () => {
    const src = `\
# line-1
# line-2
# @generated begin test-tag - expo prebuild (DO NOT MODIFY)
test appending contents
# @generated end test-tag`;
    const newContents = appendContents(src, 'another contents', {
      tag: 'test-tag',
      commentPrefix: '#',
    });
    expect(newContents).toMatchInlineSnapshot(`
      "# line-1
      # line-2
      # @generated begin test-tag - expo prebuild (DO NOT MODIFY)
      test appending contents
      another contents
      # @generated end test-tag"
    `);
  });

  it('should append new sectioned contents for new tag', () => {
    const src = `\
# line-1
# line-2
# @generated begin test-tag - expo prebuild (DO NOT MODIFY)
test appending contents
# @generated end test-tag`;
    const newContents = appendContents(src, 'another contents', {
      tag: 'another-tag',
      commentPrefix: '#',
    });
    expect(newContents).toMatchInlineSnapshot(`
      "# line-1
      # line-2
      # @generated begin test-tag - expo prebuild (DO NOT MODIFY)
      test appending contents
      # @generated end test-tag
      # @generated begin another-tag - expo prebuild (DO NOT MODIFY)
      another contents
      # @generated end another-tag"
    `);
  });
});

describe(purgeContents, () => {
  it('should purge existing section', () => {
    const src = `\
# line-1
# line-2
# @generated begin test-tag - expo prebuild (DO NOT MODIFY)
test appending contents
# @generated end test-tag`;
    const newContents = purgeContents(src, { tag: 'test-tag', commentPrefix: '#' });
    expect(newContents).toMatchInlineSnapshot(`
      "# line-1
      # line-2"
    `);
  });

  it('should leave contents untouched when tag not found', () => {
    const src = `\
# line-1
# line-2
# @generated begin test-tag - expo prebuild (DO NOT MODIFY)
test appending contents
# @generated end test-tag`;
    const newContents = purgeContents(src, { tag: 'another-tag', commentPrefix: '#' });
    expect(newContents).toMatchInlineSnapshot(`
      "# line-1
      # line-2
      # @generated begin test-tag - expo prebuild (DO NOT MODIFY)
      test appending contents
      # @generated end test-tag"
    `);
  });
});
