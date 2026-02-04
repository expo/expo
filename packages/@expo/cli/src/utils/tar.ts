import { streamToAsyncIterable, TarTypeFlag, untar } from 'multitars';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

import { ensureDirectoryAsync } from './dir';

const debug = require('debug')('expo:utils:tar') as typeof console.log;

class ChecksumStream extends TransformStream {
  hash: crypto.Hash;
  constructor(algorithm: string) {
    super({
      transform: (chunk, controller) => {
        this.hash.update(chunk);
        controller.enqueue(chunk);
      },
    });
    this.hash = crypto.createHash(algorithm);
  }

  digest(): Buffer;
  digest(encoding: crypto.BinaryToTextEncoding): string;
  digest(encoding?: crypto.BinaryToTextEncoding): string | Buffer {
    return this.hash.digest(encoding!);
  }
}

export interface ExtractOptions {
  strip?: number;
  filter?(name: string, type: TarTypeFlag): boolean | null | undefined;
  rename?(name: string, type: TarTypeFlag): string | null | undefined;
  checksumAlgorithm?: string;
}

export async function extractStream(
  input: ReadableStream,
  output: string,
  options: ExtractOptions = {}
): Promise<string> {
  output = path.resolve(output);
  await ensureDirectoryAsync(output);

  const { checksumAlgorithm, strip = 0, rename, filter } = options;

  const checksumStream = new ChecksumStream(checksumAlgorithm || 'md5');
  const decompressionStream = new DecompressionStream('gzip');

  const body = input.pipeThrough(checksumStream).pipeThrough(decompressionStream);

  for await (const file of untar(body)) {
    let name = path.normalize(file.name);
    if (filter && !filter(name, file.typeflag)) {
      debug(`filtered: ${path.resolve(output, name)}`);
      continue;
    } else if (rename) {
      name = rename(name, file.typeflag) ?? name;
    }

    for (let idx = 0; idx < strip; idx++) {
      const sepIdx = name.indexOf(path.sep);
      if (sepIdx > -1) {
        name = name.slice(sepIdx + 1);
      } else {
        break;
      }
    }

    const resolved = path.resolve(output, name);
    if (!resolved.startsWith(output)) {
      debug(`skip: ${resolved}`);
      continue;
    }

    const parent = path.dirname(resolved);
    if (parent !== output) {
      let exists = false;
      try {
        const stat = await fs.promises.lstat(parent);
        if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
          debug(`skip: ${resolved}`);
          continue;
        } else if (stat.isDirectory()) {
          exists = true;
        }
      } catch {}

      if (!exists) {
        debug(`mkdir(p): ${parent}`);
        await fs.promises.mkdir(parent, { recursive: true });
      }
    }

    switch (file.typeflag) {
      case TarTypeFlag.FILE:
        debug(`write(${file.mode.toString(8)}): ${resolved}`);
        await fs.promises.writeFile(resolved, streamToAsyncIterable(file.stream()), {
          mode: file.mode,
        });
        break;
      case TarTypeFlag.DIRECTORY:
        debug(`mkdir(${file.mode.toString(8)}): ${resolved}`);
        try {
          await fs.promises.mkdir(resolved, { mode: file.mode });
        } catch (error: any) {
          if (error.code !== 'EEXIST') {
            throw error;
          }
        }
        break;
      case TarTypeFlag.SYMLINK:
      case TarTypeFlag.LINK: {
        const target = path.resolve(parent, file.linkname ?? '');
        if (!target.startsWith(output) || target === parent) {
          debug(`skip: ${resolved} -> ${target}`);
          continue;
        }

        if (file.typeflag === TarTypeFlag.LINK) {
          debug(`link: ${resolved} -> ${target}`);
          await fs.promises.link(target, resolved);
        } else {
          const stat = await fs.promises.lstat(target).catch(() => null);
          const type = stat?.isDirectory() ? 'dir' : 'file';
          debug(`symlink(${type}): ${resolved} -> ${target}`);
          await fs.promises.symlink(target, resolved, type);
        }
        break;
      }
    }
  }

  return checksumStream.digest('hex');
}

/** Extract a tar using built-in tools if available and falling back on Node.js. */
export async function extractAsync(
  input: string,
  output: string,
  options?: ExtractOptions
): Promise<void> {
  await extractStream(
    Readable.toWeb(fs.createReadStream(input)) as ReadableStream,
    output,
    options
  );
}
