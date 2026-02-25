import spawnAsync from '@expo/spawn-async';
import * as path from 'path';

const debug = require('debug')('expo:utils:getRunningProcess') as typeof console.log;

/** Timeout applied to shell commands */
const timeout = 350;

/** Returns a pid value for a running port like `63828` or null if nothing is running on the given port. */
export async function getPID(port: number): Promise<number | null> {
  try {
    const { stdout } = await spawnAsync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], {
      timeout,
    });
    const pid = Number(stdout.split('\n', 1)[0].trim());
    debug(`pid: ${pid} for port: ${port}`);
    return Number.isSafeInteger(pid) ? pid : null;
  } catch (error: any) {
    debug(`No pid found for port: ${port}. Error: ${error}`);
    return null;
  }
}

/** Get `package.json` `name` field for a given directory. Returns `null` if none exist. */
function getPackageName(packageRoot: string): string | null {
  try {
    const packageJson = path.resolve(packageRoot, 'package.json');
    return require(packageJson).name || null;
  } catch (error) {
    return null;
  }
}

/** Returns a command like `node /Users/evanbacon/.../bin/expo start` or the package.json name. */
export async function getProcessCommand(
  pid: number,
  procDirectory: string
): Promise<string | null> {
  let name = getPackageName(procDirectory);
  if (!name) {
    // ps
    // -o args=: Output argv without header
    // -p [pid]: For process of PID
    const { stdout } = await spawnAsync('ps', ['-o', 'args=', '-p', `${pid}`], {
      timeout,
    });
    name = stdout.trim();
  }
  return name || null;
}

/** Get directory for a given process ID. */
export async function getDirectoryOfProcessById(pid: number): Promise<string | null> {
  try {
    // lsof
    // -F n: ask for machine readable output
    // -a: apply conditions as logical AND
    // -d cwd: Filter by cwd fd
    // -p [pid]: Filter by input process id
    const { stdout } = await spawnAsync('lsof', ['-F', 'n', '-a', '-d', 'cwd', '-p', `${pid}`], {
      timeout,
    });
    const processCWD = stdout
      .split('\n')
      .find((output) => output.startsWith('n'))
      ?.slice(1);
    return processCWD && path.isAbsolute(processCWD) ? path.normalize(processCWD) : null;
  } catch {
    return null;
  }
}

interface RunningProcess {
  /** The PID value for the port. */
  pid: number;
  /** Get the directory for the running process. */
  directory: string;
  /** The command running the process like `node /Users/evanbacon/.../bin/expo start` or the `package.json` name like `my-app`. */
  command: string;
}

/** Get information about a running process given a port. Returns null if no process is running on the given port. */
export async function getRunningProcess(port: number): Promise<RunningProcess | null> {
  // Don't even try on Windows, since `lsof` and `ps` are not available there
  if (process.platform === 'win32') {
    return null;
  }

  const pid = await getPID(port);
  if (!pid) {
    return null;
  }
  try {
    const directory = await getDirectoryOfProcessById(pid);
    if (directory) {
      const command = await getProcessCommand(pid, directory);
      if (command) {
        return { pid, directory, command };
      }
    }
  } catch {}
  return null;
}
