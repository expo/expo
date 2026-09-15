import fs from 'node:fs';
import path from 'node:path';

export type WriteFile = (filePath: string, contents: string) => Promise<void>;

export const writeFileAsync: WriteFile = async (filePath, contents) => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, contents, 'utf8');
};

/**
 * Restores overwritten files and removes new files/directories if generation fails.
 * Only writes through the supplied `writeFile` callback are tracked. Callers keep later steps,
 * such as dependency installation and Git initialization, outside this rollback scope.
 */
export async function withFileRollback<T>(
  action: (writeFile: WriteFile) => Promise<T>
): Promise<T> {
  const originals = new Map<string, Buffer | null>();
  const createdDirectories = new Set<string>();

  const writeFile: WriteFile = async (filePath, contents) => {
    filePath = path.resolve(filePath);
    if (!originals.has(filePath)) {
      const stat = await fs.promises.lstat(filePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (stat?.isSymbolicLink()) {
        throw new Error(`Refusing to overwrite symbolic link: ${filePath}`);
      }
      const original = await fs.promises
        .readFile(filePath)
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return null;
          throw error;
        });
      originals.set(filePath, original);
    }

    const parent = path.dirname(filePath);
    const firstCreated = await fs.promises.mkdir(parent, { recursive: true });
    if (firstCreated) {
      for (let dir = parent; ; dir = path.dirname(dir)) {
        createdDirectories.add(dir);
        if (dir === firstCreated) break;
      }
    }
    await fs.promises.writeFile(filePath, contents, 'utf8');
  };

  try {
    return await action(writeFile);
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const [filePath, original] of [...originals].reverse()) {
      try {
        if (original === null) {
          await fs.promises.rm(filePath, { force: true });
        } else {
          await fs.promises.writeFile(filePath, original);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const dir of [...createdDirectories].sort((a, b) => b.length - a.length)) {
      try {
        await fs.promises.rmdir(dir);
      } catch (rollbackError) {
        // Keep directories if something else wrote to them during generation.
        const code = (rollbackError as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT' && code !== 'ENOTEMPTY') rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        'Generation failed and could not fully restore the original files.'
      );
    }
    throw error;
  }
}
