import { vol } from 'memfs';

import { getPublicFolderPath, getUserDefinedFile } from '../publicFolder';

beforeEach(() => vol.reset());

describe(getUserDefinedFile, () => {
  it(`returns null when no favicon is defined`, () => {
    vol.fromJSON({}, '/');

    const faviconFile = getUserDefinedFile('/project', ['favicon.ico']);

    expect(faviconFile).toBeNull();
  });

  it(`returns the favicon file when defined`, () => {
    vol.fromJSON(
      {
        'project/public/favicon.ico': '...',
      },
      '/'
    );

    expect(getUserDefinedFile('/project', ['favicon.ico'])).toBe('/project/public/favicon.ico');
  });
});

describe(getPublicFolderPath, () => {
  const projectRoot = '/project';

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_FOLDER;
  });

  it('resolves the default "public" folder inside the project root', () => {
    expect(getPublicFolderPath(projectRoot)).toBe('/project/public');
  });

  it('honors a relative override that stays inside the project root', () => {
    process.env.EXPO_PUBLIC_FOLDER = 'static';
    expect(getPublicFolderPath(projectRoot)).toBe('/project/static');
  });

  it('rejects parent-traversal values that escape the project root', () => {
    process.env.EXPO_PUBLIC_FOLDER = '../other';
    expect(() => getPublicFolderPath(projectRoot)).toThrow(/outside the project root/);
  });

  it('rejects absolute paths that escape the project root', () => {
    process.env.EXPO_PUBLIC_FOLDER = '/etc';
    expect(() => getPublicFolderPath(projectRoot)).toThrow(/outside the project root/);
  });

  it('rejects values that resolve to the project root itself', () => {
    process.env.EXPO_PUBLIC_FOLDER = '.';
    expect(() => getPublicFolderPath(projectRoot)).toThrow(/outside the project root/);
  });
});
