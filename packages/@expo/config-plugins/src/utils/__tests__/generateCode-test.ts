import { removeGeneratedContents } from '../generateCode';

describe(removeGeneratedContents, () => {
  it('should not remove contents from different tags', () => {
    const barTagContent = [
      '// @generated begin foo-bar - expo prebuild (DO NOT MODIFY)',
      'some bar content',
      '// @generated end foo-bar',
    ].join('\n');

    const fooTagContent = [
      '// @generated begin foo - expo prebuild (DO NOT MODIFY)',
      'some foo content',
      '// @generated end foo',
    ].join('\n');

    const content = [barTagContent, 'after bar', fooTagContent, 'after foo'];

    const result = removeGeneratedContents(content.join('\n'), 'foo');

    const contentWithoutFoo = [...content.slice(0, 2), ...content.slice(3)].join('\n');
    expect(result).toBe(contentWithoutFoo);
  });
});
