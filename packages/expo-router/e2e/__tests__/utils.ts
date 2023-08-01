/* eslint-env jest */

import findProcess from 'find-process';
import path from 'path';
import treeKill from 'tree-kill';
import { promisify } from 'util';

export const bin = 'expo-internal';

export function ensureTesterReady(fixtureName: string): string {
  const root = path.join(__dirname, '../../../../apps/router-e2e');
  console.log('Using fixture:', fixtureName);
  // Clear metro cache for the env var to be updated
  // await fs.remove(path.join(root, "node_modules/.cache/metro"));

  // @ts-ignore
  process.env.E2E_ROUTER_SRC = fixtureName;

  return root;
}

const pTreeKill = promisify(treeKill);

export async function ensurePortFreeAsync(port: number) {
  const [portProcess] = await findProcess('port', port);
  if (!portProcess) {
    return;
  }
  console.log(`Killing process ${portProcess.name} on port ${port}...`);
  try {
    await pTreeKill(portProcess.pid);
    console.log(`Killed process ${portProcess.name} on port ${port}`);
  } catch (error: any) {
    console.log(`Failed to kill process ${portProcess.name} on port ${port}: ${error.message}`);
  }
}
