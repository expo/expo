import { vol } from 'memfs';

import { Ignore } from '../ignoreWrapper';

jest.mock('fs');

beforeEach(() => {
  vol.reset();
});

describe(Ignore, () => {
  it('reads .gitignore from subdirectory', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'aaa',
        'dir/.gitignore': 'bbb',
      },
      '/root'
    );

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(ignore.ignores('aaa')).toBe(true);
    expect(ignore.ignores('bbb')).toBe(false);
    expect(ignore.ignores('dir/aaa')).toBe(true);
    expect(ignore.ignores('dir/bbb')).toBe(true);
  });

  it('ignores .gitignore files if .easignore is present', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'aaa',
        '.easignore': 'ccc',
        'dir/.gitignore': 'bbb',
      },
      '/root'
    );

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(ignore.ignores('aaa')).toBe(false);
    expect(ignore.ignores('bbb')).toBe(false);
    expect(ignore.ignores('ccc')).toBe(true);
    expect((ignore as any).ignoreMapping.map((i: any) => i[0])).toEqual(['', '']);
  });

  it('ignores .gitignore files in node_modules content', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'aaa',
        'dir/.gitignore': 'bbb',
        'node_modules/.gitignore': 'bbb',
      },
      '/root'
    );

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(ignore.ignores('aaa')).toBe(true);
    expect(ignore.ignores('bbb')).toBe(false);
    expect(ignore.ignores('node_modules/aaa')).toBe(true);
    expect(ignore.ignores('node_modules/bbb')).toBe(true);
    expect((ignore as any).ignoreMapping.map((i: any) => i[0])).toEqual(['', '', 'dir/']);
  });

  it('applies all gitignore files in parent directories', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'dir/ccc',
        'dir/.gitignore': 'bbb',
      },
      '/root'
    );

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(ignore.ignores('dir/ccc')).toBe(true);
  });

  it('ignores .git', async () => {
    vol.fromJSON({}, '/root');

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(ignore.ignores('.git')).toBe(true);
  });

  it('does not throw an error if there is a trailing backslash in the gitignore', async () => {
    vol.fromJSON(
      {
        '.gitignore': 'dir\\',
      },
      '/root'
    );

    const ignore = new Ignore('/root');
    await ignore.initIgnoreAsync();
    expect(() => ignore.ignores('dir/test')).not.toThrowError();
  });
});
