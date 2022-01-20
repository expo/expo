import { execFileSync, execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import * as path from 'path';

const defaultOptions: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'ignore'],
};

function getPID(port: number) {
  return execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], defaultOptions)
    .split('\n')[0]
    .trim();
}

function getPackageName(packageRoot: string): string | null {
  const packageJson = path.join(packageRoot.trim(), 'package.json');
  try {
    return require(packageJson).name || null;
  } catch {
    return null;
  }
}

function getProcessCommand(pid: string, procDirectory: string): string {
  const results = execSync(`ps -o command -p ${pid} | sed -n 2p`, defaultOptions)
    .replace(/\n$/, '')
    .trim();

  const name = getPackageName(procDirectory);
  return name ? name : results;
}

function getDirectoryOfProcessById(processId: string): string {
  return execSync(
    'lsof -p ' + processId + ' | awk \'$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}\'',
    defaultOptions
  ).trim();
}

export function getRunningProcess(
  port: number
): { pid: string; directory: string; command: string } | null {
  try {
    // 63828
    const pid = getPID(port);
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
