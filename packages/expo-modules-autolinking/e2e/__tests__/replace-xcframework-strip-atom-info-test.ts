import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.unmock('fs');

const scriptsDir = path.join(__dirname, '../../scripts/ios');
const replaceXcframeworkPath = path.join(scriptsDir, 'replace-xcframework.js');
const precompiledModulesPath = path.join(scriptsDir, 'precompiled_modules.rb');

type Flavor = 'debug' | 'release';
type BinaryKind = { mergeable: boolean; signed?: boolean };

function commandSucceeds(command: string, args: string[]): boolean {
  return spawnSync(command, args, { stdio: 'pipe' }).status === 0;
}

const canBuildMachO =
  process.platform === 'darwin' && commandSucceeds('xcrun', ['--find', 'clang']);

function hasAtomInfo(binary: string): boolean {
  return execFileSync('xcrun', ['otool', '-l', binary]).toString().includes('LC_ATOM_INFO');
}

function frameworkBinary(xcframework: string, name: string): string {
  return path.join(xcframework, 'ios-arm64', `${name}.framework`, name);
}

// Writes <dir>/<name>.xcframework with one slice, laid out like the precompiled tarballs.
function writeXcframework(dir: string, name: string, { mergeable, signed }: BinaryKind): string {
  const xcframework = path.join(dir, `${name}.xcframework`);
  const binary = frameworkBinary(xcframework, name);
  fs.mkdirSync(path.dirname(binary), { recursive: true });

  const source = path.join(dir, `${name}.c`);
  fs.writeFileSync(source, `int ${name}_value(void) { return 42; }\n`);
  execFileSync('xcrun', [
    'clang',
    '-dynamiclib',
    ...(mergeable ? ['-Wl,-make_mergeable'] : []),
    '-install_name',
    `@rpath/${name}.framework/${name}`,
    '-o',
    binary,
    source,
  ]);
  fs.rmSync(source);
  fs.writeFileSync(
    path.join(path.dirname(binary), 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>${name}</string>
<key>CFBundleIdentifier</key><string>dev.expo.test.${name}</string>
<key>CFBundlePackageType</key><string>FMWK</string>
</dict></plist>
`
  );
  if (signed) {
    execFileSync('codesign', ['--force', '--sign', '-', binary], { stdio: 'pipe' });
  }
  return binary;
}

function packTarball(stagingDir: string, tarball: string, names: string[]): void {
  execFileSync('tar', [
    '-czf',
    tarball,
    '-C',
    stagingDir,
    ...names.map((name) => `${name}.xcframework`),
  ]);
}

function runSwitch(podDir: string, config: string, extraArgs: string[] = []) {
  return spawnSync(
    process.execPath,
    [replaceXcframeworkPath, '-c', config, '-m', 'ExpoFoo', '-x', podDir, ...extraArgs],
    { stdio: 'pipe' }
  );
}

(canBuildMachO ? describe : describe.skip)('replace-xcframework strips LC_ATOM_INFO', () => {
  let tmpDir: string;
  let podDir: string;
  const stagedBinaries: Record<Flavor, Record<string, string>> = { debug: {}, release: {} };
  let sharedDepBinary: string;
  let sharedDepBase: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-strip-atom-info-'));
    sharedDepBase = path.join(tmpDir, 'spm-deps', 'SharedDep');
    sharedDepBinary = writeXcframework(path.join(sharedDepBase, 'release'), 'SharedDep', {
      mergeable: true,
    });

    const releaseContents: Record<string, BinaryKind> = {
      ExpoFoo: { mergeable: true },
      PlainDep: { mergeable: false },
      SignedDep: { mergeable: true, signed: true },
    };
    const debugContents: Record<string, BinaryKind> = { ExpoFoo: { mergeable: true } };

    const artifactsDir = path.join(tmpDir, 'artifacts-template');
    fs.mkdirSync(artifactsDir);
    for (const [flavor, contents] of [
      ['release', releaseContents],
      ['debug', debugContents],
    ] as const) {
      const stagingDir = path.join(tmpDir, 'staging', flavor);
      for (const [name, kind] of Object.entries(contents)) {
        stagedBinaries[flavor][name] = writeXcframework(stagingDir, name, kind);
      }
      packTarball(
        stagingDir,
        path.join(artifactsDir, `ExpoFoo-${flavor}.tar.gz`),
        Object.keys(contents)
      );
    }
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    podDir = fs.mkdtempSync(path.join(tmpDir, 'pod-'));
    fs.cpSync(path.join(tmpDir, 'artifacts-template'), path.join(podDir, 'artifacts'), {
      recursive: true,
    });
  });

  function switchTo(config: string, extraArgs: string[] = []): void {
    const result = runSwitch(podDir, config, extraArgs);
    expect({ status: result.status, stderr: result.stderr.toString() }).toEqual({
      status: 0,
      stderr: '',
    });
  }

  function extractedBinary(name: string): string {
    return frameworkBinary(path.join(podDir, `${name}.xcframework`), name);
  }

  it('removes LC_ATOM_INFO from a mergeable binary on a Release switch', () => {
    expect(hasAtomInfo(stagedBinaries.release.ExpoFoo)).toBe(true);

    switchTo('Release');

    expect(hasAtomInfo(extractedBinary('ExpoFoo'))).toBe(false);
    expect(
      fs.readFileSync(path.join(podDir, 'artifacts', '.last_build_configuration'), 'utf8')
    ).toBe('release');
  });

  it('leaves a binary without LC_ATOM_INFO unchanged on a Release switch', () => {
    switchTo('Release');

    expect(fs.readFileSync(extractedBinary('PlainDep'))).toEqual(
      fs.readFileSync(stagedBinaries.release.PlainDep)
    );
  });

  it('never strips on a Debug switch', () => {
    switchTo('Debug');

    expect(fs.readFileSync(extractedBinary('ExpoFoo'))).toEqual(
      fs.readFileSync(stagedBinaries.debug.ExpoFoo)
    );
  });

  it('keeps a valid signature on a binary that was signed before', () => {
    switchTo('Release');

    const binary = extractedBinary('SignedDep');
    expect(hasAtomInfo(binary)).toBe(false);
    expect(commandSucceeds('codesign', ['--verify', binary])).toBe(true);
  });

  it('does not modify a shared dependency outside the pod directory', () => {
    const before = fs.readFileSync(sharedDepBinary);

    switchTo('Release', ['--shared', `SharedDep:${sharedDepBase}`]);

    expect(fs.lstatSync(path.join(podDir, 'SharedDep.xcframework')).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(sharedDepBinary)).toEqual(before);
  });

  it('forgets the previous flavor when a switch fails', () => {
    switchTo('Debug');
    fs.writeFileSync(path.join(podDir, 'artifacts', 'ExpoFoo-release.tar.gz'), 'not a tarball');

    expect(runSwitch(podDir, 'Release').status).not.toBe(0);

    expect(fs.existsSync(path.join(podDir, 'artifacts', '.last_build_configuration'))).toBe(false);
  });
});

function rubyAvailable(): boolean {
  return commandSucceeds('ruby', ['--version']);
}

(rubyAvailable() ? describe : describe.skip)('precompiled modules ensure_artifacts', () => {
  const ensureArtifactsScript = `
require 'json'

module Pod
  module UI
    def self.puts(*args); end
    def self.info(*args); end
    def self.warn(*args); end
  end
end

require ARGV.fetch(0)
input = JSON.parse(STDIN.read)

ENV['EXPO_PRECOMPILED_FLAVOR'] = input['flavor']
modules = Expo::PrecompiledModules
modules.define_singleton_method(:enabled?) { true }
modules.define_singleton_method(:has_prebuilt_xcframework?) { |_pod_name| true }
modules.define_singleton_method(:pod_lookup_map) do
  { 'ExpoFoo' => { product_name: 'ExpoFoo', build_output_dir: input['buildOutputDir'] } }
end
modules.define_singleton_method(:resolve_prebuilt_tarball) do |_info, product_name, flavor, _pod_name|
  File.join(input['buildOutputDir'], flavor, "#{product_name}.tar.gz")
end

Sandbox = Struct.new(:root)
Installer = Struct.new(:sandbox)
modules.ensure_artifacts(Installer.new(Sandbox.new(input['podsRoot'])))
`;

  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-ensure-artifacts-'));
    fs.mkdirSync(path.join(tmpDir, 'Pods', 'ExpoFoo', 'ExpoFoo.xcframework'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function lastBuildConfigurationAfterInstall(flavor: Flavor): string | null {
    execFileSync('ruby', ['-e', ensureArtifactsScript, precompiledModulesPath], {
      input: JSON.stringify({
        flavor,
        podsRoot: path.join(tmpDir, 'Pods'),
        buildOutputDir: path.join(tmpDir, 'output'),
      }),
      stdio: 'pipe',
    });
    const file = path.join(tmpDir, 'Pods', 'ExpoFoo', 'artifacts', '.last_build_configuration');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  }

  // The Release flavor must be unpacked (and stripped) by the first Release build.
  it('does not record a release extraction at pod install', () => {
    expect(lastBuildConfigurationAfterInstall('release')).toBeNull();
  });

  it('records a debug extraction at pod install', () => {
    expect(lastBuildConfigurationAfterInstall('debug')).toBe('debug');
  });
});
