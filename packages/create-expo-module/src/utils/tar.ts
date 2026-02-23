import fs from 'node:fs';
import { Stream } from 'node:stream';
import { promisify } from 'node:util';
import { extract as tarExtract } from 'tar';

const pipeline = promisify(Stream.pipeline);

/** Extract a local tarball file to a directory */
export async function extractLocalTarball({ filePath, dir }: { filePath: string; dir: string }) {
  await pipeline(fs.createReadStream(filePath), tarExtract({ cwd: dir }));
}
