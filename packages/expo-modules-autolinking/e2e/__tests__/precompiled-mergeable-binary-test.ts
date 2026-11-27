import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { join } from 'path';

jest.unmock('fs');

const precompiledModulesPath = join(__dirname, '../../scripts/ios/precompiled_modules.rb');

const dynamicBinaryScript = `
require 'cocoapods'
require 'cocoapods/xcode'
require ARGV.fetch(0)
puts Pod::Xcode::LinkageAnalyzer.dynamic_binary?(Pathname.new(ARGV.fetch(1)))
`;

function succeeds(command: string, args: string[]): boolean {
  try {
    execFileSync(command, args, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const canRun =
  process.platform === 'darwin' &&
  succeeds('xcrun', ['--find', 'clang']) &&
  succeeds('ruby', ['-e', "require 'cocoapods'"]);

(canRun ? describe : describe.skip)('precompiled modules with mergeable binaries', () => {
  let tmpDir: string;
  let dylibPath: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'expo-mergeable-'));
    const sourcePath = join(tmpDir, 'm.c');
    dylibPath = join(tmpDir, 'libm.dylib');
    fs.writeFileSync(sourcePath, 'int m(void) { return 1; }\n');
    execFileSync('xcrun', [
      'clang',
      '-dynamiclib',
      '-Wl,-make_mergeable',
      '-o',
      dylibPath,
      sourcePath,
    ]);
    if (!execFileSync('otool', ['-l', dylibPath], { encoding: 'utf8' }).includes('LC_ATOM_INFO')) {
      throw new Error(`The test dylib ${dylibPath} has no LC_ATOM_INFO load command.`);
    }
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lets CocoaPods detect a mergeable dylib as dynamic', () => {
    const stdout = execFileSync(
      'ruby',
      ['-e', dynamicBinaryScript, precompiledModulesPath, dylibPath],
      { encoding: 'utf8' }
    );
    expect(stdout.trim()).toBe('true');
  });
});
