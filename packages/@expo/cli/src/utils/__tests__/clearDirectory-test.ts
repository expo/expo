import { vol } from 'memfs';

import { assertFolderEmptyAsync, getConflictsForDirectory } from '../clearDirectory';

jest.mock('@expo/image-utils', () => ({
  generateImageAsync(input, { src }) {
    const fs = require('fs');
    return { source: fs.readFileSync(src) };
  },
}));

function getDirFromFS(fsJSON: Record<string, string | null>, rootDir: string) {
  return Object.entries(fsJSON)
    .filter(([path, value]) => value !== null && path.startsWith(rootDir))
    .reduce<Record<string, string>>(
      (acc, [path, fileContent]) => ({
        ...acc,
        [path.substring(rootDir.length).startsWith('/')
          ? path.substring(rootDir.length + 1)
          : path.substring(rootDir.length)]: fileContent,
      }),
      {}
    );
}

describe(getConflictsForDirectory, () => {
  const projectRoot = '/alpha';

  beforeAll(() => {
    vol.fromJSON({
      [projectRoot + '/LICENSE']: 'noop',
      [projectRoot + '/app.js']: 'noop',
    });
  });

  afterAll(() => {
    vol.reset();
  });

  it(`skips tolerable files`, async () => {
    expect(getConflictsForDirectory(projectRoot, ['LICENSE'])).toStrictEqual(['app.js']);
    expect(getConflictsForDirectory(projectRoot, [])).toStrictEqual(['LICENSE', 'app.js']);
  });
});

describe(assertFolderEmptyAsync, () => {
  const projectRoot = '/alpha';
  const projectRootEmpty = '/beta';

  beforeEach(() => {
    vol.fromJSON({
      [projectRoot + '/LICENSE']: 'noop',
      [projectRoot + '/bundles/app.js']: 'noop',
      [projectRootEmpty + '/LICENSE']: 'noop',
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it(`returns false when conflicts are found and they cannot be removed`, async () => {
    // Should return false indicating that the CLI must exit.
    expect(await assertFolderEmptyAsync({ projectRoot: '/alpha', overwrite: false })).toBe(false);
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    // Ensure that no files were deleted.
    expect(after).toStrictEqual({ LICENSE: 'noop', 'bundles/app.js': 'noop' });
  });

  it(`returns true when no conflicts are found`, async () => {
    expect(await assertFolderEmptyAsync({ projectRoot: projectRootEmpty, overwrite: false })).toBe(
      true
    );
    const after = getDirFromFS(vol.toJSON(), projectRootEmpty);
    // Ensure that no files were deleted.
    expect(after).toStrictEqual({ LICENSE: 'noop' });
  });

  it(`returns true when conflicts are found and deleted`, async () => {
    expect(await assertFolderEmptyAsync({ projectRoot: '/alpha', overwrite: true })).toBe(true);
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    // Ensure that the tolerable files were not deleted, and the others were
    expect(after).toStrictEqual({ LICENSE: 'noop' });
  });
});
