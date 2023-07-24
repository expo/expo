/* eslint-env jest */
import findProcess from "find-process";
import os from "os";
import path from "path";
import treeKill from "tree-kill";
import { promisify } from "util";

export const bin = "expo-internal";

export function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

export async function ensureTesterReadyAsync(
  fixtureName: string
): Promise<string> {
  const root = path.join(__dirname, "../../../../apps/tester");
  console.log("Using fixture:", fixtureName);
  // Clear metro cache for the env var to be updated
  // await fs.remove(path.join(root, "node_modules/.cache/metro"));

  process.env.E2E_ROUTER_SRC = fixtureName;

  return root;
}

const pTreeKill = promisify(treeKill);

export async function ensurePortFreeAsync(port: number) {
  const [portProcess] = await findProcess("port", port);
  if (!portProcess) {
    return;
  }
  console.log(`Killing process ${portProcess.name} on port ${port}...`);
  try {
    await pTreeKill(portProcess.pid);
    console.log(`Killed process ${portProcess.name} on port ${port}`);
  } catch (error: any) {
    console.log(
      `Failed to kill process ${portProcess.name} on port ${port}: ${error.message}`
    );
  }
}
