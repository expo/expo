import spawnAsync from '@expo/spawn-async';
import { streamToAsyncIterable, TarTypeFlag, untar } from 'multitars';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import zlib from 'node:zlib';

import * as Log from '../log';
import { ensureDirectoryAsync } from './dir';

const debug = require('debug')('expo:utils:tar') as typeof console.log;

export interface ExtractOptions {
  strip?: number;
  filter?(name: string, type: TarTypeFlag): boolean | null | undefined;
  rename?(name: string, type: TarTypeFlag): string | null | undefined;
  checksumAlgorithm?: string;
}

export async function extractStream(
  input: NodeJS.ReadableStream,
  output: string,
  options: ExtractOptions = {}
): Promise<string> {
  output = path.resolve(output);
  await ensureDirectoryAsync(output);

  const { checksumAlgorithm, strip = 0, rename, filter } = options;

  const hash = crypto.createHash(checksumAlgorithm || 'md5');
  const digestStream = new PassThrough();
  digestStream.on('data', (chunk) => hash.update(chunk));

  const gunzip = zlib.createGunzip({
    flush: zlib.constants.Z_SYNC_FLUSH,
    finishFlush: zlib.constants.Z_SYNC_FLUSH,
  });

  const archive = input.pipe(digestStream).pipe(gunzip);
  const body = Readable.toWeb(archive);

  for await (const file of untar(body)) {
    let name = path.normalize(file.name);
    for (let idx = 0; idx < strip; idx++) {
      const sepIdx = name.indexOf(path.sep);
      if (sepIdx > -1) {
        name = name.slice(sepIdx + 1);
      } else {
        break;
      }
    }

    if (filter && !filter(name, file.typeflag)) {
      debug(`filtered: ${path.resolve(output, name)}`);
      continue;
    } else if (rename) {
      name = rename(name, file.typeflag) ?? name;
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

  return hash.digest('hex');
}

/** Extract a tar using built-in tools if available and falling back on Node.js. */
export async function extractAsync(
  input: string,
  output: string,
  options?: ExtractOptions
): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      debug(`Extracting ${input} to ${output}`);
      await spawnAsync('tar', ['-xf', input, '-C', output], {
        stdio: 'inherit',
      });
      return;
    }
  } catch (error: any) {
    Log.warn(
      `Failed to extract tar using native tools, falling back on JS extraction. ${error.message}`
    );
  }

  await extractStream(fs.createReadStream(input), output, options);
}
