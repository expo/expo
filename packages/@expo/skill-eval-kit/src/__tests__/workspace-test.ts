import fs from 'fs';
import os from 'os';
import path from 'path';

import { createWorkspace, stripComments } from '../workspace';

describe(stripComments, () => {
  it('strips line and block comments', () => {
    expect(stripComments('const a = 1; // PRAGMA user_version\nconst b = 2;')).toBe(
      'const a = 1; \nconst b = 2;'
    );
    expect(stripComments('/* PRAGMA user_version */ const a = 1;')).toBe(' const a = 1;');
  });

  it('keeps string and template contents intact', () => {
    expect(stripComments(`const url = 'https://expo.dev';`)).toBe(
      `const url = 'https://expo.dev';`
    );
    expect(stripComments('db.execAsync(`PRAGMA user_version = 1`);')).toBe(
      'db.execAsync(`PRAGMA user_version = 1`);'
    );
    expect(stripComments('const sql = `SELECT * /* not a comment */ FROM t`;')).toBe(
      'const sql = `SELECT * /* not a comment */ FROM t`;'
    );
  });

  it('handles escaped quotes', () => {
    expect(stripComments(`const s = 'don\\'t'; // gone`)).toBe(`const s = 'don\\'t'; `);
  });
});

describe(createWorkspace, () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-eval-kit-test-'));
    fs.mkdirSync(path.join(root, 'src', 'db', 'migrations'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules', 'dep'), { recursive: true });
    fs.writeFileSync(path.join(root, 'package.json'), '{"dependencies":{"expo-sqlite":"*"}}');
    fs.writeFileSync(path.join(root, 'App.tsx'), 'export default 1; // comment');
    fs.writeFileSync(path.join(root, 'src', 'db', 'migrations', '001_init.ts'), 'export {};');
    fs.writeFileSync(path.join(root, 'node_modules', 'dep', 'index.js'), 'ignored');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reads files and reports existence', () => {
    const ws = createWorkspace(root, 'with-skill');
    expect(ws.read('App.tsx')).toContain('export default 1');
    expect(ws.read('missing.ts')).toBe('');
    expect(ws.exists('src/db/migrations/001_init.ts')).toBe(true);
  });

  it('excludes node_modules from sources and strips comments from source()', () => {
    const ws = createWorkspace(root, 'with-skill');
    expect(ws.sourceFiles().map((f) => f.path)).toEqual(
      expect.arrayContaining(['App.tsx', path.join('src', 'db', 'migrations', '001_init.ts')])
    );
    expect(ws.source()).not.toContain('ignored');
    expect(ws.source()).not.toContain('// comment');
  });

  it('globs workspace-relative paths', () => {
    const ws = createWorkspace(root, 'with-skill');
    expect(ws.glob('src/db/migrations/*.{ts,tsx,js,sql}')).toEqual([
      path.join('src', 'db', 'migrations', '001_init.ts'),
    ]);
    expect(ws.glob('nope/*.ts')).toEqual([]);
  });

  it('parses package.json', () => {
    const ws = createWorkspace(root, 'with-skill');
    expect(ws.packageJson()?.dependencies?.['expo-sqlite']).toBe('*');
  });
});
