import { getFileName } from '../getCssModulesFromBundler';

describe(getFileName, () => {
  it('returns the filename from the filepath', () => {
    expect(getFileName('/foo/bar/@another.module.css')).toMatchInlineSnapshot(`"@another.module"`);
  });
});
