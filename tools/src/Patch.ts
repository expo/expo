import spawnAsync from '@expo/spawn-async';

export async function runPatchAsync(options: {
  patchContent: string;
  cwd: string;
  reverse?: boolean;
  stripPrefixNum?: number;
}) {
  const args: string[] = [];
  if (options.stripPrefixNum != null) {
    // -pN passing to the `patch` command for striping slashed prefixes
    args.push(`-p${options.stripPrefixNum}`);
  }
  if (options.reverse) {
    args.push('-R');
  }

  const procPromise = spawnAsync('patch', args, {
    cwd: options.cwd,
  });
  procPromise.child.stdin?.write(options.patchContent);
  procPromise.child.stdin?.end();
  await procPromise;
}
