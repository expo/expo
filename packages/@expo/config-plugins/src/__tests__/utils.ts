import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const packageRoot = path.resolve(__dirname, '../..');

export function buildPackage() {
  execFileSync(
    process.execPath,
    [require.resolve('turbo/bin/turbo'), 'run', 'build', '--filter=@expo/config-plugins'],
    { cwd: packageRoot }
  );
}

export function typecheckFixture(fixture: string) {
  const { error, status, stdout, stderr } = spawnSync(
    process.execPath,
    [require.resolve('typescript/bin/tsc'), '-p', path.join(__dirname, '__fixtures__', fixture)],
    { cwd: packageRoot, encoding: 'utf8' }
  );
  if (error) {
    throw error;
  }
  return { status, stdout, stderr };
}
