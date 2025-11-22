import { vol } from 'memfs';

import { listFilesSorted, listFilesInDirectories, scanFilesRecursively } from '../utils';

afterEach(() => {
  vol.reset();
});

describe(listFilesSorted, () => {
  it('returns sorted files', async () => {
    vol.fromJSON(
      {
        'a.txt': 'a',
        'c.txt': 'c',
        'b.txt': 'b',
        exclude: '',
      },
      '/'
    );

    expect(await listFilesSorted('/', (name) => name !== 'exclude')).toEqual([
      '/a.txt',
      '/b.txt',
      '/c.txt',
    ]);
  });

  it('handles invalid target', async () => {
    vol.fromJSON({}, '/');
    expect(await listFilesSorted('/not-found', () => true)).toEqual([]);
  });
});

describe(listFilesInDirectories, () => {
  it('returns sorted files', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          exclude: '',
        },
        a: {
          'a.txt': 'a',
          exclude: '',
        },
        b: {
          'b.txt': 'a',
          exclude: '',
        },
      },
      '/'
    );

    expect(await listFilesInDirectories('/', (name) => name !== 'exclude')).toEqual([
      'a/a.txt',
      'b/b.txt',
    ]);
  });
});

describe(scanFilesRecursively, () => {
  it('emits files recursively', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          exclude: '',
        },
        'a.txt': 'a',
        b: {
          'b.txt': 'b',
        },
        c: {
          c: {
            'c.txt': 'c',
          },
        },
      },
      '/'
    );

    const entries: unknown[] = [];
    for await (const entry of scanFilesRecursively('/')) {
      entries.push(entry);
    }

    expect(entries).toMatchInlineSnapshot(`
      [
        {
          "name": "a.txt",
          "parentPath": "/",
          "path": "/a.txt",
        },
        {
          "name": "b.txt",
          "parentPath": "/b",
          "path": "/b/b.txt",
        },
        {
          "name": "c.txt",
          "parentPath": "/c/c",
          "path": "/c/c/c.txt",
        },
      ]
    `);
  });

  it('excludes directories if they match condition', async () => {
    vol.fromNestedJSON(
      {
        excludeA: {
          file: '',
        },
        a: {
          exclude: {
            file: '',
          },
        },
        c: {
          c: {
            'c.txt': 'c',
          },
        },
      },
      '/'
    );

    const entries: unknown[] = [];
    const exclude = (parentPath: string, basename: string) => {
      return basename.startsWith('exclude') || parentPath.endsWith('exclude');
    };
    for await (const entry of scanFilesRecursively('/', exclude)) {
      entries.push(entry);
    }

    expect(entries).toMatchInlineSnapshot(`
      [
        {
          "name": "file",
          "parentPath": "/excludeA",
          "path": "/excludeA/file",
        },
      ]
    `);
  });

  it('optionally sorts results', async () => {
    vol.fromNestedJSON(
      {
        c: {
          c: {
            'c.txt': 'c',
          },
        },
        a: {
          'a.txt': 'a',
        },
        b: {
          'b.txt': 'b',
        },
      },
      '/'
    );

    const entries: unknown[] = [];
    for await (const entry of scanFilesRecursively('/', undefined, true)) {
      entries.push(entry);
    }

    expect(entries).toMatchInlineSnapshot(`
      [
        {
          "name": "a.txt",
          "parentPath": "/a",
          "path": "/a/a.txt",
        },
        {
          "name": "b.txt",
          "parentPath": "/b",
          "path": "/b/b.txt",
        },
        {
          "name": "c.txt",
          "parentPath": "/c/c",
          "path": "/c/c/c.txt",
        },
      ]
    `);
  });
});
