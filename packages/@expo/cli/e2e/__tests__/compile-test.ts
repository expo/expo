import execa from 'execa';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { executeExpoAsync } from '../utils/expo';

const bin = require.resolve('../../bin/cli');
const itIos = process.platform === 'darwin' ? it : it.skip;
const env = {
  CI: '1',
  FORCE_COLOR: '0',
  EXPO_DEBUG: '0',
  DEBUG: '',
  EXPO_NO_TELEMETRY: '1',
  EXPO_OFFLINE: '1',
};
let projectRoot: string;

beforeEach(async () => {
  projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-compile-command-'));
});

afterEach(async () => {
  await fs.rm(projectRoot, { recursive: true, force: true });
});

function runCompile(argv: string[], extraEnv: NodeJS.ProcessEnv = {}) {
  return executeExpoAsync(projectRoot, argv, {
    env: { ...env, ...extraEnv },
    reject: false,
    stripFinalNewline: false,
    verbose: false,
    timeout: 30_000,
  });
}

it.each(['compile', 'compile:ios', 'compile:android'])(
  'shows help for %s without a project or mode',
  async (command) => {
    const result = await runCompile([command, '--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`npx expo ${command}`);
    expect(result.stdout).toMatch(/--dev.*--development/);
    expect(result.stdout).toMatch(/--prod.*--production/);
    expect(result.stdout).toContain('--output-type');
    expect(result.stdout).toContain('--output-dir');
    expect(result.stdout).toContain('--device');
    if (command === 'compile:android') {
      expect(result.stdout).toContain('APK only');
      expect(result.stdout).toContain('test-only');
      expect(result.stdout).not.toContain('ipa');
    }
    expect(result.stdout).not.toMatch(/--configuration|--variant|--scheme/);
    expect(result.stderr).toBe('');
    expect(await fs.readdir(projectRoot)).toEqual([]);
  }
);

it.each([
  { args: ['compile', 'ios'], error: /Choose exactly one mode/ },
  { args: ['compile:ios'], error: /Choose exactly one mode/ },
  { args: ['compile:android'], error: /Choose exactly one mode/ },
  { args: ['compile', 'windows', '--dev'], error: /Platform must be "ios" or "android"/ },
  { args: ['compile:ios', '--dev', '--production'], error: /Choose exactly one mode/ },
  { args: ['compile:android', '--development', '--prod'], error: /Choose exactly one mode/ },
  { args: ['compile:ios', '--dev', '--configuration', 'Debug'], error: /Unknown option/ },
  { args: ['compile:android', '--dev', '--variant', 'debug'], error: /Unknown option/ },
  { args: ['compile:ios', '--dev', '--output-type', 'apk'], error: /iOS command supports/ },
  { args: ['compile:android', '--dev', '--output-type', 'app'], error: /Android command supports/ },
  {
    args: ['compile:ios', '--prod', '--output-type', 'ipa'],
    error: /IPA export requires --device/,
  },
  {
    args: ['compile:android', '--dev', '--device', '--output-type', 'aab'],
    error: /Android device targeting requires --output-type apk/,
  },
  { args: ['compile:ios', '--dev', '--device=id,name=injected'], error: /Device ID must contain/ },
])(
  'rejects $args before reading project config or building native files',
  async ({ args, error }) => {
    await fs.writeFile(
      path.join(projectRoot, 'app.config.js'),
      'throw new Error("Compile must validate arguments before reading app config.");'
    );
    const result = await runCompile(args);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(error);
    expect(result.stderr).not.toContain('before reading app config');
    expect(await fs.readdir(projectRoot)).toEqual(['app.config.js']);
  }
);

it('requires a platform in noninteractive mode', async () => {
  const result = await runCompile(['compile', '--dev']);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toMatch(/platform/i);
  expect(result.stderr).toMatch(/compile:ios|compile ios/);
  expect(result.stderr).toMatch(/compile:android|compile android/);
  expect(await fs.readdir(projectRoot)).toEqual([]);
});

it.each(['missing', 'file'])('rejects a %s project directory before building', async (kind) => {
  const invalidRoot = path.join(projectRoot, kind);
  if (kind === 'file') await fs.writeFile(invalidRoot, 'keep this file');
  const result = await runCompile(['compile:android', invalidRoot, '--dev']);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain(`Invalid project directory: ${invalidRoot}`);
  expect(result.stderr).not.toMatch(/\n\s+at /);
  expect(await fs.readdir(projectRoot)).toEqual(kind === 'file' ? ['file'] : []);
});

describe.each([
  { command: ['compile', 'android'] },
  { command: ['compile:android'] },
  { command: ['compile', 'ios'] },
  { command: ['compile:ios'] },
])('option separator for $command', ({ command }) => {
  const test = command.some((part) => part.endsWith('ios')) ? itIos : it;

  test.each(['--prod', '--device', '--output-type', '--help', '-h', '--version', '-v', '--'])(
    'treats %s after -- as the project path',
    async (projectName) => {
      const expectedRoot = path.join(await fs.realpath(projectRoot), projectName);
      for (const projectArgs of [['--', projectName], [`./${projectName}`]]) {
        const result = await runCompile([...command, '--dev', ...projectArgs]);
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain(`Invalid project directory: ${expectedRoot}`);
        expect(await fs.readdir(projectRoot)).toEqual([]);
      }
    }
  );

  it.each(['--help', '-h'])('keeps the global %s flag before --', async (flag) => {
    const result = await runCompile([...command, flag, '--', '--prod']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Compile a native app');
    expect(result.stderr).toBe('');
    expect(await fs.readdir(projectRoot)).toEqual([]);
  });

  it.each(['--version', '-v'])('keeps the global %s flag before --', async (flag) => {
    const result = await runCompile([...command, flag, '--', '--prod']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${require('../../package.json').version}\n`);
    expect(result.stderr).toBe('');
    expect(await fs.readdir(projectRoot)).toEqual([]);
  });
});

it.each([
  { command: ['compile', 'android'], mode: '--dev' },
  { command: ['compile:android'], mode: '--production' },
])(
  'requires native Android sources for $command $mode without prebuild',
  async ({ command, mode }) => {
    await writeExpoConfigFixture();
    const result = await runCompile([...command, mode]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/No gradlew(?:\.bat)? found/);
    expect(result.stderr).not.toMatch(/\n\s+at /);
    expect(await fs.readdir(projectRoot)).toEqual([
      'app.config.js',
      'node_modules',
      'package.json',
    ]);
  }
);

itIos.each([
  { command: ['compile', 'ios'], mode: '--dev' },
  { command: ['compile:ios'], mode: '--production' },
])('requires native iOS sources for $command $mode without prebuild', async ({ command, mode }) => {
  await writeExpoConfigFixture();
  const result = await runCompile([...command, mode]);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('No Xcode project or workspace found');
  expect(result.stderr).not.toMatch(/\n\s+at /);
  expect(await fs.readdir(projectRoot)).toEqual(['app.config.js', 'node_modules', 'package.json']);
});

itIos('reports missing Pods without evaluating app config or installing dependencies', async () => {
  await writeExpoConfigFixture();
  const nativeRoot = path.join(projectRoot, 'ios');
  await fs.mkdir(path.join(nativeRoot, 'Example.xcworkspace'), { recursive: true });
  const podfile = [
    'File.write(File.join(__dir__, "podfile-read"), "unexpected")',
    'raise "Compile must not execute CocoaPods."',
  ].join('\n');
  await fs.writeFile(path.join(nativeRoot, 'Podfile'), podfile);

  const result = await runCompile(['compile:ios', '--dev']);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('Pods directory is missing');
  expect(result.stderr).toContain("Install the project's Pods before running compile.");
  expect(result.stderr).not.toMatch(/\n\s+at /);
  expect(await fs.readdir(projectRoot)).toEqual([
    'app.config.js',
    'ios',
    'node_modules',
    'package.json',
  ]);
  expect(await fs.readdir(nativeRoot)).toEqual(['Example.xcworkspace', 'Podfile']);
  expect(await fs.readFile(path.join(nativeRoot, 'Podfile'), 'utf8')).toBe(podfile);
});

it('reports missing Gradle sources in an existing native directory without prebuild', async () => {
  await fs.mkdir(path.join(projectRoot, 'android'));
  const result = await runCompile(['compile:android', '--dev']);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toMatch(/No gradlew(?:\.bat)? found/);
  expect(result.stderr).not.toMatch(/\n\s+at /);
  expect(await fs.readdir(projectRoot)).toEqual(['android']);
  expect(await fs.readdir(path.join(projectRoot, 'android'))).toEqual([]);
});

it.each([
  { command: ['compile', 'android'], mode: '--dev', task: 'compileAndroidDevelopmentApk' },
  { command: ['compile:android'], mode: '--production', task: 'compileAndroidProductionApk' },
])(
  'prints only artifact paths through the public package for $command $mode',
  async ({ command, mode, task }) => {
    await writeExpoConfigFixture();
    const first = path.join(projectRoot, 'first app.apk');
    const second = path.join(projectRoot, 'second app.apk');
    await fs.writeFile(first, 'first artifact fixture');
    await fs.writeFile(second, 'second artifact fixture');
    await writeGradleFixture([
      'const fs = require("node:fs");',
      'console.log("native stdout");',
      'console.error("native stderr");',
      `if (process.argv[2] !== ${JSON.stringify(task)}) process.exit(41);`,
      `fs.writeFileSync(process.env.COMPILE_ANDROID_REPORT, ${JSON.stringify(JSON.stringify({ paths: [second, first] }))});`,
    ]);

    const result = await runCompile([...command, mode]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${first}\n${second}\n`);
    expect(result.stderr).toBe('');
    await expect(fs.stat(path.join(projectRoot, 'config-read'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  }
);

describe('Android device compilation', () => {
  itNotWindows('uses the explicit Wi-Fi serial and keeps its ABI preference order', async () => {
    const serial = '192.0.2.10:37123';
    const adb = await writeAdbFixture([
      { serial: 'other-device', state: 'device', abis: ['arm64-v8a'] },
      { serial, state: 'device', abis: ['x86_64', 'x86'] },
    ]);
    const artifact = await writeApkFixture('wifi.apk');
    const gradleAbiPath = await writeDeviceGradleFixture([artifact], {
      expectedArchitectures: ['x86_64', 'x86'],
    });

    const gradleOpts =
      '-Xmx1g "-Dcompile.fixture=with spaces" -Dorg.gradle.project.android.injected.build.abi=arm64-v8a -Dorg.gradle.project.reactNativeArchitectures=arm64-v8a';
    const result = await runCompile(['compile:android', '--dev', '--device', serial], {
      ...adb.env,
      GRADLE_OPTS: gradleOpts,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${artifact}\n`);
    expect(result.stderr).toBe('');
    expect(await fs.readFile(gradleAbiPath, 'utf8')).toBe('x86_64,x86');
    expect(await fs.readFile(path.join(projectRoot, 'gradle-options.txt'), 'utf8')).toBe(
      `${gradleOpts} -Dorg.gradle.project.android.injected.build.abi=x86_64,x86 -Dorg.gradle.project.reactNativeArchitectures=x86_64,x86`
    );
    expect(await fs.readFile(adb.commandsPath, 'utf8')).toBe(
      `devices -l\n-s ${serial} shell 'getprop' 'ro.product.cpu.abilist'\n`
    );
  });

  itNotWindows('uses the only authorized device for a bare --device', async () => {
    const serial = 'usb-device';
    const adb = await writeAdbFixture([
      { serial: 'locked-device', state: 'unauthorized', abis: [] },
      { serial, state: 'device', abis: ['arm64-v8a'] },
    ]);
    const artifact = await writeApkFixture('usb.apk');
    const gradleAbiPath = await writeDeviceGradleFixture([artifact], {
      expectedArchitectures: ['arm64-v8a'],
    });

    const result = await runCompile(['compile', 'android', '--dev', '--device'], adb.env);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${artifact}\n`);
    expect(result.stderr).toBe('');
    expect(await fs.readFile(gradleAbiPath, 'utf8')).toBe('arm64-v8a');
    expect(await fs.readFile(adb.commandsPath, 'utf8')).toBe(
      `devices -l\n-s ${serial} shell 'getprop' 'ro.product.cpu.abilist'\n`
    );
  });

  itNotWindows('falls back to the single ABI property and copies a production APK', async () => {
    const serial = 'older-device';
    const adb = await writeAdbFixture([{ serial, state: 'device', abis: [], abi: 'arm64-v8a' }]);
    const artifact = await writeApkFixture('fallback.apk');
    const gradleAbiPath = await writeDeviceGradleFixture([artifact], {
      task: 'compileAndroidProductionApk',
      expectedArchitectures: ['arm64-v8a'],
    });

    const result = await runCompile(
      ['compile:android', '--prod', '--device', serial, '--output-dir', './output'],
      adb.env
    );
    const destination = path.join(await fs.realpath(projectRoot), 'output', 'fallback.apk');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${destination}\n`);
    expect(result.stderr).toBe('');
    expect(await fs.readFile(destination)).toEqual(await fs.readFile(artifact));
    expect(await fs.readFile(gradleAbiPath, 'utf8')).toBe('arm64-v8a');
    expect(await fs.readFile(adb.commandsPath, 'utf8')).toBe(
      `devices -l\n-s ${serial} shell 'getprop' 'ro.product.cpu.abilist'\n-s ${serial} shell 'getprop' 'ro.product.cpu.abi'\n`
    );
  });

  itNotWindows.each([undefined, 'x86'])(
    'keeps the inherited ABI setting %j without --device',
    async (abi) => {
      const adb = await writeAdbFixture([]);
      const artifact = path.join(projectRoot, 'untargeted.apk');
      await fs.writeFile(artifact, 'artifact fixture without device ABI validation');
      const gradleAbiPath = await writeDeviceGradleFixture([artifact]);

      const gradleOpts = abi
        ? `-Dorg.gradle.project.android.injected.build.abi=${abi} -Dorg.gradle.project.reactNativeArchitectures=${abi}`
        : undefined;
      const result = await runCompile(['compile:android', '--dev'], {
        ...adb.env,
        GRADLE_OPTS: gradleOpts,
        COMPILE_ANDROID_EXPECTED_ARCHITECTURES: 'arm64-v8a',
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe(`${artifact}\n`);
      expect(result.stderr).toBe('');
      expect(await fs.readFile(gradleAbiPath, 'utf8')).toBe(abi ?? '<unset>');
      expect(await fs.readFile(path.join(projectRoot, 'gradle-options.txt'), 'utf8')).toBe(
        gradleOpts ?? ''
      );
      await expect(fs.stat(adb.commandsPath)).rejects.toMatchObject({ code: 'ENOENT' });
    }
  );

  itNotWindows.each([
    {
      devices: [
        { serial: 'first-device', state: 'device' as const, abis: ['arm64-v8a'] },
        { serial: 'second-device', state: 'device' as const, abis: ['x86'] },
      ],
      args: ['--device'],
      error: /exactly one connected, authorized Android device.*Found 2/,
    },
    {
      devices: [{ serial: 'locked-device', state: 'unauthorized' as const, abis: [] }],
      args: ['--device', 'locked-device'],
      error:
        /Android device "locked-device" must match exactly one connected, authorized device that is ready for commands/,
    },
  ])(
    'rejects $args before Gradle when device selection fails',
    async ({ devices, args, error }) => {
      const adb = await writeAdbFixture(devices);
      const gradleAbiPath = await writeDeviceGradleFixture([]);

      const result = await runCompile(['compile:android', '--dev', ...args], adb.env);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toMatch(error);
      expect(await fs.readFile(adb.commandsPath, 'utf8')).toBe('devices -l\n');
      await expect(fs.stat(gradleAbiPath)).rejects.toMatchObject({ code: 'ENOENT' });
    }
  );

  itNotWindows('returns Gradle artifacts without looking for jar or JAVA_HOME', async () => {
    const adb = await writeAdbFixture([
      { serial: 'usb-device', state: 'device', abis: ['arm64-v8a'] },
    ]);
    const artifact = await writeApkFixture('without-jar.apk');
    const gradleAbiPath = await writeDeviceGradleFixture([artifact], {
      expectedArchitectures: ['arm64-v8a'],
    });
    const tools = path.join(projectRoot, 'tools');
    await fs.mkdir(tools);
    await fs.symlink(process.execPath, path.join(tools, 'node'));
    await fs.symlink('/usr/bin/dirname', path.join(tools, 'dirname'));

    const result = await runCompile(['compile:android', '--dev', '--device'], {
      ...adb.env,
      JAVA_HOME: undefined,
      PATH: tools,
    });
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${artifact}\n`);
    expect(await fs.readFile(gradleAbiPath, 'utf8')).toBe('arm64-v8a');
  });

  itNotWindows.each([
    'Cannot inspect Android artifact "app.apk": invalid ZIP file.',
    'Android artifact "app.apk" contains native libraries for x86, but expected arm64-v8a.',
  ])(
    'reports Gradle validation failures before copying or printing artifacts: %s',
    async (failure) => {
      const adb = await writeAdbFixture([
        { serial: 'usb-device', state: 'device', abis: ['arm64-v8a'] },
      ]);
      const artifact = await writeApkFixture('app.apk');
      await writeDeviceGradleFixture([artifact], {
        expectedArchitectures: ['arm64-v8a'],
        failure,
      });

      const result = await runCompile(
        ['compile:android', '--dev', '--device', '--output-dir', './output'],
        adb.env
      );
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain(failure);
      await expect(fs.stat(path.join(projectRoot, 'output'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    }
  );
});

it('copies a reported AAB to an output directory relative to the supplied project', async () => {
  const nativeRoot = path.join(projectRoot, 'native app');
  await fs.mkdir(nativeRoot);
  const source = path.join(nativeRoot, 'example.aab');
  await fs.writeFile(source, 'bundle fixture');
  await writeGradleFixture(
    [
      'const fs = require("node:fs");',
      'if (process.argv[2] !== "compileAndroidProductionAab") process.exit(42);',
      `fs.writeFileSync(process.env.COMPILE_ANDROID_REPORT, ${JSON.stringify(JSON.stringify({ paths: [source] }))});`,
    ],
    nativeRoot
  );

  const result = await runCompile([
    'compile:android',
    nativeRoot,
    '--prod',
    '--output-type',
    'aab',
    '--output-dir',
    '../build outputs',
  ]);
  const destination = path.join(projectRoot, 'build outputs', 'example.aab');
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe(`${destination}\n`);
  expect(result.stderr).toBe('');
  expect(await fs.readFile(destination, 'utf8')).toBe('bundle fixture');
});

it('preserves a Gradle process failure code and diagnostics', async () => {
  await writeGradleFixture([
    'console.log("native stdout");',
    'console.error("native stderr");',
    'process.exitCode = 23;',
  ]);
  const result = await runCompile(['compile:android', '--dev']);
  expect(result.exitCode).toBe(23);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('Gradle failed with exit code 23');
  expect(result.stderr).toContain('native stdout');
  expect(result.stderr).toContain('native stderr');
  expect(result.stderr).not.toMatch(/\n\s+at /);
});

it('preserves full native output when a Gradle failure exceeds the diagnostic tail', async () => {
  const logRoot = path.join(await fs.realpath(projectRoot), 'native logs');
  await fs.mkdir(logRoot);
  const stdout = 'early native stdout diagnostic\n' + 'native stdout detail\n'.repeat(1_000);
  const stderr = 'early native stderr diagnostic\n' + 'native stderr detail\n'.repeat(1_000);
  await writeGradleFixture([
    `process.stdout.write(${JSON.stringify(stdout)});`,
    `process.stderr.write(${JSON.stringify(stderr)});`,
    'process.exitCode = 23;',
  ]);

  const result = await runCompile(['compile:android', '--dev'], {
    TMPDIR: logRoot,
    TMP: logRoot,
    TEMP: logRoot,
  });
  expect(result.exitCode).toBe(23);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain('Gradle failed with exit code 23');
  expect(result.stderr).not.toContain('early native stdout diagnostic');
  expect(result.stderr).not.toContain('early native stderr diagnostic');
  expect(result.stderr).not.toMatch(/\n\s+at /);

  const logFilePath = result.stderr.match(/^Full native output saved to (.+)$/m)?.[1];
  if (!logFilePath) throw new Error(`Compile did not report the native log path: ${result.stderr}`);
  expect(path.isAbsolute(logFilePath)).toBe(true);
  expect((await fs.realpath(logFilePath)).startsWith(logRoot + path.sep)).toBe(true);
  const output = await fs.readFile(logFilePath, 'utf8');
  expect(output).toContain(stdout);
  expect(output).toContain(stderr);
});

itNotWindows.each([
  ['SIGINT', 130],
  ['SIGTERM', 143],
] as const)('cancels the CLI and its native child processes with %s', async (signal, exitCode) => {
  const readyPath = path.join(projectRoot, 'ready.json');
  await writeGradleFixture([
    'const { spawn } = require("node:child_process");',
    'const fs = require("node:fs");',
    'const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });',
    'child.once("spawn", () => {',
    `  fs.writeFileSync(${JSON.stringify(readyPath + '.tmp')}, JSON.stringify([process.pid, child.pid]));`,
    `  fs.renameSync(${JSON.stringify(readyPath + '.tmp')}, ${JSON.stringify(readyPath)});`,
    '});',
    'setInterval(() => {}, 1000);',
  ]);
  await expectCancellation(readyPath, signal, exitCode);
});

async function expectCancellation(readyPath: string, signal: NodeJS.Signals, exitCode: number) {
  const cli = execa(process.execPath, [bin, 'compile:android', '--dev'], {
    cwd: projectRoot,
    env,
    reject: false,
    stripFinalNewline: false,
    timeout: 30_000,
  });
  let pids: number[] = [];
  try {
    pids = await waitForNativeProcesses(readyPath, cli);
    cli.kill(signal);
    const result = await cli;
    expect(result.exitCode).toBe(exitCode);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(signal);
    for (const pid of pids) {
      for (let attempt = 0; attempt < 100 && processExists(pid); attempt++) {
        await setTimeout(20);
      }
      expect(processExists(pid)).toBe(false);
    }
  } finally {
    cli.kill('SIGKILL');
    await cli;
    for (const pid of pids) {
      if (processExists(pid)) process.kill(pid, 'SIGKILL');
    }
  }
}

async function writeGradleFixture(lines: string[], directory = projectRoot) {
  await fs.writeFile(path.join(directory, 'gradle.cjs'), lines.join('\n'));
  const wrapper = process.platform === 'win32' ? 'gradlew.bat' : 'gradlew';
  const script =
    process.platform === 'win32'
      ? '@echo off\r\nnode "%~dp0gradle.cjs" %*\r\n'
      : '#!/bin/sh\nexec node "$(dirname "$0")/gradle.cjs" "$@"\n';
  await fs.writeFile(path.join(directory, wrapper), script, { mode: 0o755 });
}

async function writeAdbFixture(
  devices: { serial: string; state: 'device' | 'unauthorized'; abis: string[]; abi?: string }[]
) {
  const sdkRoot = path.join(projectRoot, 'android-sdk');
  const platformTools = path.join(sdkRoot, 'platform-tools');
  const commandsPath = path.join(projectRoot, 'adb-commands.txt');
  await fs.mkdir(platformTools, { recursive: true });
  const deviceList = [
    'List of devices attached',
    ...devices.map(
      ({ serial, state }, index) =>
        `${serial}\t${state} model:CompileFixture transport_id:${index + 1}`
    ),
    '',
  ].join('\n');
  await fs.writeFile(
    path.join(platformTools, 'adb'),
    [
      '#!/usr/bin/env node',
      'const fs = require("node:fs");',
      'const args = process.argv.slice(2);',
      `fs.appendFileSync(${JSON.stringify(commandsPath)}, args.join(" ") + "\\n");`,
      `const devices = ${JSON.stringify(devices)};`,
      'if (args.length === 2 && args[0] === "devices" && args[1] === "-l") {',
      `  process.stdout.write(${JSON.stringify(deviceList)});`,
      '} else if (args.length === 5 && args[0] === "-s" && args[2] === "shell" && args[3] === "\'getprop\'") {',
      '  const device = devices.find((item) => item.serial === args[1]);',
      '  if (!device || device.state !== "device") throw new Error("Unexpected device property query");',
      '  if (args[4] === "\'ro.product.cpu.abilist\'") console.log(device.abis.join(","));',
      '  else if (args[4] === "\'ro.product.cpu.abi\'") console.log(device.abi ?? device.abis[0] ?? "");',
      '  else throw new Error("Unexpected ADB property");',
      '} else throw new Error("Unexpected ADB command: " + args.join(" "));',
    ].join('\n'),
    { mode: 0o755 }
  );
  return { env: { ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot }, commandsPath };
}

async function writeApkFixture(name: string) {
  const artifact = path.join(projectRoot, name);
  await fs.writeFile(artifact, 'artifact fixture returned by Gradle');
  return artifact;
}

async function writeDeviceGradleFixture(
  artifacts: string[],
  {
    task = 'compileAndroidDevelopmentApk',
    expectedArchitectures = [],
    failure,
  }: { task?: string; expectedArchitectures?: string[]; failure?: string } = {}
) {
  const abiPath = path.join(projectRoot, 'gradle-abi.txt');
  await writeGradleFixture([
    'const fs = require("node:fs");',
    `if (process.argv[2] !== ${JSON.stringify(task)}) throw new Error("Unexpected Gradle task: " + process.argv[2]);`,
    `if ((process.env.COMPILE_ANDROID_EXPECTED_ARCHITECTURES ?? "") !== ${JSON.stringify(expectedArchitectures.join(','))}) throw new Error("Unexpected architecture constraint");`,
    'const options = process.env.GRADLE_OPTS ?? "";',
    'const abi = [...options.matchAll(/(?:^|\\s)-Dorg\\.gradle\\.project\\.android\\.injected\\.build\\.abi=([^\\s]+)/g)].at(-1)?.[1];',
    `fs.writeFileSync(${JSON.stringify(abiPath)}, abi ?? "<unset>");`,
    `fs.writeFileSync(${JSON.stringify(path.join(projectRoot, 'gradle-options.txt'))}, options);`,
    ...(failure === undefined
      ? []
      : [`console.error(${JSON.stringify(failure)}); process.exit(1);`]),
    `fs.writeFileSync(process.env.COMPILE_ANDROID_REPORT, ${JSON.stringify(JSON.stringify({ paths: artifacts }))});`,
  ]);
  return abiPath;
}

async function writeExpoConfigFixture() {
  const expoPackage = path.join(projectRoot, 'node_modules', 'expo');
  await fs.mkdir(expoPackage, { recursive: true });
  await fs.writeFile(
    path.join(expoPackage, 'package.json'),
    JSON.stringify({ name: 'expo', version: '57.0.0' })
  );
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({
      name: 'compile-native-source-fixture',
      version: '1.0.0',
      dependencies: { expo: '*' },
    })
  );
  await fs.writeFile(
    path.join(projectRoot, 'app.config.js'),
    [
      'const fs = require("node:fs");',
      `fs.writeFileSync(${JSON.stringify(path.join(projectRoot, 'config-read'))}, "unexpected");`,
      'throw new Error("Compile must not evaluate app config.");',
    ].join('\n')
  );
}

async function waitForNativeProcesses(
  file: string,
  cli: execa.ExecaChildProcess
): Promise<number[]> {
  for (let attempt = 0; attempt < 500; attempt++) {
    let value: unknown;
    try {
      value = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (
        !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
      )
        throw error;
    }
    if (value !== undefined) {
      if (
        !Array.isArray(value) ||
        value.length !== 2 ||
        !value.every(
          (pid: unknown): pid is number =>
            typeof pid === 'number' && Number.isInteger(pid) && pid > 0
        )
      ) {
        throw new Error('The native process fixture reported invalid process IDs.');
      }
      return value;
    }
    if (cli.exitCode !== null || cli.signalCode !== null) {
      const result = await cli;
      throw new Error(`Compile exited before the native process started: ${result.stderr}`);
    }
    await setTimeout(20);
  }
  throw new Error('The native process fixture did not start.');
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH')
      return false;
    throw error;
  }
}
