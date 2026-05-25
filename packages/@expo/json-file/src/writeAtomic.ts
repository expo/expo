import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

function getTarget(filename: string, data: string | Buffer) {
  const hash = createHash('sha256').update(data).digest('base64url');
  return `${filename}.${hash}`;
}

export interface WriteFileAtomicOptions {
  mode?: fs.Mode;
}

export function writeFileAtomicSync(
  filename: string,
  data: string | Buffer,
  options: WriteFileAtomicOptions = {}
): void {
  const tmpfile = getTarget(filename, data);
  fs.writeFileSync(tmpfile, data, options.mode !== undefined ? { mode: options.mode } : undefined);
  fs.renameSync(tmpfile, filename);
  // rename preserves any pre-existing destination mode; chmod after to enforce the requested mode.
  if (options.mode !== undefined) {
    fs.chmodSync(filename, options.mode);
  }
}

export async function writeFileAtomic(
  filename: string,
  data: string | Buffer,
  options: WriteFileAtomicOptions = {}
): Promise<void> {
  const tmpfile = getTarget(filename, data);
  await fs.promises.writeFile(
    tmpfile,
    data,
    options.mode !== undefined ? { mode: options.mode } : undefined
  );
  await fs.promises.rename(tmpfile, filename);
  if (options.mode !== undefined) {
    await fs.promises.chmod(filename, options.mode);
  }
}
