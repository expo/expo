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
  // Write to the symlink target (if any) so the link itself is not replaced.
  let target = filename;
  try {
    target = fs.realpathSync(filename);
  } catch {
    // The file does not exist yet.
  }
  let mode = options.mode;
  if (mode === undefined) {
    try {
      // `rename` does not carry over the mode of the file being replaced.
      mode = fs.statSync(target).mode & 0o7777;
    } catch {
      // The file does not exist yet.
    }
  }
  const tmpfile = getTarget(target, data);
  fs.writeFileSync(tmpfile, data, mode !== undefined ? { mode } : undefined);
  if (mode !== undefined) {
    // The mode passed to `writeFileSync` is subject to the umask; chmod enforces it.
    fs.chmodSync(tmpfile, mode);
  }
  fs.renameSync(tmpfile, target);
}

export async function writeFileAtomic(
  filename: string,
  data: string | Buffer,
  options: WriteFileAtomicOptions = {}
): Promise<void> {
  // Write to the symlink target (if any) so the link itself is not replaced.
  let target = filename;
  try {
    target = await fs.promises.realpath(filename);
  } catch {
    // The file does not exist yet.
  }
  let mode = options.mode;
  if (mode === undefined) {
    try {
      // `rename` does not carry over the mode of the file being replaced.
      mode = (await fs.promises.stat(target)).mode & 0o7777;
    } catch {
      // The file does not exist yet.
    }
  }
  const tmpfile = getTarget(target, data);
  await fs.promises.writeFile(tmpfile, data, mode !== undefined ? { mode } : undefined);
  if (mode !== undefined) {
    // The mode passed to `writeFile` is subject to the umask; chmod enforces it.
    await fs.promises.chmod(tmpfile, mode);
  }
  await fs.promises.rename(tmpfile, target);
}
