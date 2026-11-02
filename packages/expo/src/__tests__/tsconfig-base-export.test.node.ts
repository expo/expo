import { execFileSync } from 'node:child_process';
import path from 'node:path';

const packageRoot = path.resolve(__dirname, '../..');
const tsconfigBasePath = path.join(packageRoot, 'tsconfig.base.json');

// Jest replaces require, so check Node's own resolution
const resolveInNode = (specifier: string) =>
  execFileSync(process.execPath, ['-p', `require.resolve(${JSON.stringify(specifier)})`], {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

describe('expo package exports', () => {
  it("resolves 'expo/tsconfig.base' to the package's 'tsconfig.base.json'", () => {
    expect(resolveInNode('expo/tsconfig.base')).toBe(tsconfigBasePath);
  });

  it("resolves 'expo/tsconfig.base.json' to the package's 'tsconfig.base.json'", () => {
    expect(resolveInNode('expo/tsconfig.base.json')).toBe(tsconfigBasePath);
  });
});
