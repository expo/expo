import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

function getTarget(filename: string, data: string | Buffer) {
  const hash = createHash('sha256').update(data).digest('base64url');
  return `${filename}.${hash}`;
}

export function writeFileAtomicSync(filename: string, data: string | Buffer): void {
  const tmpfile = getTarget(filename, data);
  fs.writeFileSync(tmpfile, data);
  fs.renameSync(tmpfile, filename);
}

export async function writeFileAtomic(filename: string, data: string | Buffer): Promise<void> {
  const tmpfile = getTarget(filename, data);
  await fs.promises.writeFile(tmpfile, data);
  await fs.promises.rename(tmpfile, filename);
}
