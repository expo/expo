import { execFileSync, execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import * as path from 'path';

const debug = require('debug')('expo:utils:getRunningProcess') as typeof console.log;

const defaultOptions: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'ignore'],
};

/** Returns a pid value for a running port like `63828` or null if nothing is running on the given port. */
export function getPID(port: number): number | null {
  try {
    const results = execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], defaultOptions)
      .split('\n')[0]
      .trim();
    const pid = Number(results);
    debug(`pid: ${pid} for port: ${port}`);
    return pid;
  } catch (error: any) {
    debug(`No pid found for port: ${port}. Error: ${error}`);
    return null;
  }
}

/** Get `package.json` `name` field for a given directory. Returns `null` if none exist. */
function getPackageName(packageRoot: string): string | null {
  const packageJson = path.join(packageRoot, 'package.json');
  try {
    return require(packageJson).name || null;
  } catch {
    return null;
  }
}

/** Returns a command like `node /Users/evanbacon/.../bin/expo start` or the package.json name. */
function getProcessCommand(pid: number, procDirectory: string): string {
  const name = getPackageName(procDirectory);

  if (name) {
    return name;
  }
  return execSync(`ps -o command -p ${pid} | sed -n 2p`, defaultOptions).replace(/\n$/, '').trim();
}

/** Get directory for a given process ID. */
export function getDirectoryOfProcessById(processId: number): string {
  return execSync(
    `lsof -p ${processId} | awk '$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}'`,
    defaultOptions
  ).trim();
}

/** Get information about a running process given a port. Returns null if no process is running on the given port. */
export function getRunningProcess(port: number): {
  /** The PID value for the port. */
  pid: number;
  /** Get the directory for the running process. */
  directory: string;
  /** The command running the process like `node /Users/evanbacon/.../bin/expo start` or the `package.json` name like `my-app`. */
  command: string;
} | null {
  // 63828
  const pid = getPID(port);
  if (!pid) {
    return null;
  }

  try {
    // /Users/evanbacon/Documents/GitHub/lab/myapp
    const directory = getDirectoryOfProcessById(pid);
    // /Users/evanbacon/Documents/GitHub/lab/myapp/package.json
    const command = getProcessCommand(pid, directory);
    // TODO: Have a better message for reusing another process.
    return { pid, directory, command };
  } catch {
    return null;
  }
}
