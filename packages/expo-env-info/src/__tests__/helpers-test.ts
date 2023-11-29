import { vol } from 'memfs';

import { findFile } from '../helpers';

jest.mock('fs');

describe(findFile, () => {
  const projectRoot = '/';

  beforeAll(() => {
    vol.fromJSON(
      {
        '/foo/bar/baz/test.json': '',
        '/foo/bar/qux/bar.txt': '',
        '/foo/bar/qux/boo.blurb': '',
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it('finds nested files', async () => {
    const result = await findFile(projectRoot, '.blurb');
    expect(result).toBeTruthy();
  });

  it('does not find files that do not exist', async () => {
    const result = await findFile(projectRoot, '.boo');
    expect(result).toBeFalsy();
  });

  it('does not find any files in a folder that does not exist', async () => {
    const result = await findFile('/donotexist', '.boo');
    expect(result).toBeFalsy();
  });

  it('follows symlinks', async () => {
    vol.symlinkSync('/foo/bar/baz', '/foo/bar/qux/target');
    const result = await findFile('/foo/bar/qux', '.json');
    expect(result).toBeTruthy();
  });
});
