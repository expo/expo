import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { withFileRollback } from '../utils/files';

describe(withFileRollback, () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'module-rollback-'));
  });

  afterEach(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  it('restores overwritten files and removes new files and directories after a later failure', async () => {
    const original = Buffer.from([0, 255, 10]);
    const existing = path.join(root, 'existing.ts');
    await fs.promises.writeFile(existing, original, { mode: 0o640 });
    const originalMode = (await fs.promises.stat(existing)).mode;
    await fs.promises.mkdir(path.join(root, 'existing-dir'));

    await expect(
      withFileRollback(async (writeFile) => {
        await writeFile(existing, 'first change');
        await writeFile(existing, 'second change');
        await writeFile(path.join(root, 'new-module', 'src', 'index.ts'), 'new');
        await writeFile(path.join(root, 'existing-dir', 'new.ts'), 'new');
        throw new Error('late rendering error');
      })
    ).rejects.toThrow('late rendering error');

    expect(await fs.promises.readFile(existing)).toEqual(original);
    expect((await fs.promises.stat(existing)).mode).toBe(originalMode);
    expect(await fs.promises.readdir(root)).toEqual(['existing-dir', 'existing.ts']);
    expect(await fs.promises.readdir(path.join(root, 'existing-dir'))).toEqual([]);
  });

  it('rolls back earlier writes when a destination is a directory', async () => {
    const directory = path.join(root, 'index.ts');
    await fs.promises.mkdir(directory);
    await expect(
      withFileRollback(async (writeFile) => {
        await writeFile(path.join(root, 'src', 'module.ts'), 'new');
        await writeFile(directory, 'barrel');
      })
    ).rejects.toThrow();
    expect(await fs.promises.readdir(root)).toEqual(['index.ts']);
    expect((await fs.promises.stat(directory)).isDirectory()).toBe(true);
  });

  it('reports the original error when a read-only file was left unchanged', async () => {
    const readOnly = path.join(root, 'read-only.ts');
    await fs.promises.writeFile(readOnly, 'original');
    await fs.promises.chmod(readOnly, 0o444);

    const result = withFileRollback(async (writeFile) => {
      await writeFile(path.join(root, 'new.ts'), 'new');
      await writeFile(readOnly, 'replacement');
    });

    await expect(result).rejects.not.toBeInstanceOf(AggregateError);
    await expect(result).rejects.toMatchObject({ code: 'EACCES' });
    expect(await fs.promises.readFile(readOnly, 'utf8')).toBe('original');
    expect(await fs.promises.readdir(root)).toEqual(['read-only.ts']);
  });

  it('preserves a dangling symlink when refusing to overwrite it', async () => {
    const link = path.join(root, 'index.ts');
    await fs.promises.symlink('missing.ts', link);
    await expect(
      withFileRollback(async (writeFile) => {
        await writeFile(path.join(root, 'new.ts'), 'new');
        await writeFile(link, 'replacement');
      })
    ).rejects.toThrow('symbolic link');
    expect(await fs.promises.readlink(link)).toBe('missing.ts');
    expect(await fs.promises.readdir(root)).toEqual(['index.ts']);
  });
});
