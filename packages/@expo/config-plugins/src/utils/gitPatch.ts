import spawnAsync from '@expo/spawn-async';
import { boolish } from 'getenv';

const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

export async function applyPatchAsync(projectRoot: string, patchFilePath: string) {
  return await runGitAsync(['apply', patchFilePath], { cwd: projectRoot });
}

export async function getPatchChangedLinesAsync(patchFilePath: string): Promise<number> {
  const stdout = await runGitAsync(['apply', '--numstat', patchFilePath]);
  const lines = stdout.split(/\r?\n/);
  let changedLines = 0;
  for (const line of lines) {
    if (line === '') {
      continue;
    }
    const [added, deleted] = line.split('\t', 2);
    changedLines += Number(added) + Number(deleted);
  }
  return changedLines;
}

async function runGitAsync(args: string[], options?: spawnAsync.SpawnOptions): Promise<string> {
  try {
    const { stdout, stderr } = await spawnAsync('git', args, options);
    if (EXPO_DEBUG) {
      console.log(`Running \`git ${args}\` outputs:\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
    return stdout;
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      e.message += `\nGit is required to apply patches. Install Git and try again.`;
    } else if (e.stderr) {
      e.message += `\nstderr:\n${e.stderr}`;
    }
    throw e;
  }
}
