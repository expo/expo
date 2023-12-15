import { removeGeneratedContents } from '../generateCode';

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
