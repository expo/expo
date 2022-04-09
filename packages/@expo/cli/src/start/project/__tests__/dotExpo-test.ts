import { vol } from 'memfs';

import { createTemporaryProjectFile } from '../dotExpo';

beforeEach(() => {
  vol.reset();
});

describe(createTemporaryProjectFile, () => {
  it(`creates persisted file`, async () => {
    const projectRoot = '/';

    const creator = createTemporaryProjectFile<{ foo: string; baz?: boolean }>('foo.json', {
      foo: 'bar',
    });

    // Ensure instantiation doesn't have side-effects.
    expect(vol.toJSON()).toEqual({});

    // This has side-effects that ensure the directory.
    const file = creator.getFile(projectRoot);

    // README is bootstrapped.
    expect(vol.readFileSync('/.expo/README.md', 'utf8')).toMatch(/Why do I have a folder named/);

    // File is not automatically written...
    await expect(file.getAsync('foo', null)).rejects.toThrowError(/ENOENT/);

    // Matches defaults and doesn't fail when the file doesn't exist.
    expect(await creator.readAsync(projectRoot)).toEqual({ foo: 'bar' });

    // Modify the file.
    await creator.setAsync(projectRoot, { foo: 'baz', baz: true });

    // Persisted changes are reflected in the file.
    expect(await creator.readAsync(projectRoot)).toEqual({ foo: 'baz', baz: true });
  });
});
