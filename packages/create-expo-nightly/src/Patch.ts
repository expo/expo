import fs from 'node:fs';
import path from 'node:path';
import { $, chalk } from 'zx';

/**
 * Execute `patch` command for given patch file
 */
export async function applyPatchAsync({
  patchFile,
  cwd,
  destination,
  reverse,
  stripPrefixNum,
}: {
  patchFile: string;
  cwd?: string;
  destination?: string;
  reverse?: boolean;
  stripPrefixNum?: number;
}) {
  const args: string[] = ['--batch'];
  if (destination) {
    args.push('-d', destination);
  }
  if (stripPrefixNum != null) {
    args.push('-p', stripPrefixNum.toString());
  }
  if (reverse) {
    args.push('-R');
  }
  return await $({
    input: fs.createReadStream(patchFile),
    cwd: cwd ?? process.cwd(),
  })`patch ${args}`;
}

/**
 * Apply all patches in the given glob pattern
 */
export async function applyPatchesGlobAsync({
  patchGlobPattern,
  patchRoot,
  cwd,
  destination,
  reverse,
  stripPrefixNum,
}: {
  patchGlobPattern: string;
  patchRoot: string;
  cwd?: string;
  destination?: string;
  reverse?: boolean;
  stripPrefixNum?: number;
}) {
  const patchFiles = await Array.fromAsync(fs.promises.glob(patchGlobPattern, { cwd: patchRoot }));
  await Promise.all(
    patchFiles.map(async (patchFile) => {
      const patchFilePath = path.join(patchRoot, patchFile);
      console.log(chalk.cyan('Applying patch:'), patchFilePath);
      await applyPatchAsync({
        patchFile: patchFilePath,
        cwd,
        destination,
        reverse,
        stripPrefixNum,
      });
    })
  );
}
