import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { configureSourceProject, validateSourceProject } from './configure-source';
import { detachSharedNodeModules, getPackageManager, getInstallArguments } from './dependencies';
import { withGenerationRollback } from './generation';
import { discoverNativeModules } from './native';
import { findAppRoot, scaffoldExpoProject } from './scaffold';
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let root = process.cwd();

let installationCompleted = false;

type SetupSettings = {
  project: string;
  target: string;
};

function readJSON(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(command: string, args: string[], env = process.env, cwd = root): void {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} failed (${result.error?.message ?? `exit ${result.status}`}). Fix the reported error and retry the command.`
    );
  }
}

function writeIfChanged(path: string, contents: string): void {
  if (!existsSync(path) || readFileSync(path, 'utf8') !== contents) {
    writeFileSync(path, contents);
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      'frozen-lockfile': { type: 'boolean' },
      project: { type: 'string' },
      target: { type: 'string' },
      platform: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });
  if (values.help) {
    process.stdout.write(
      'Usage:\n' +
        '  npx expo-embedding init\n' +
        '  npx expo-embedding install <package...>\n\n' +
        'Options: --platform ios, --project <App.xcodeproj>, --target <App>, --frozen-lockfile (init only)\n' +
        'init creates expo/ with a Main scene when no Expo app exists.\n' +
        'Successful setup remembers the project and target.\n'
    );
    return;
  }
  const [command, ...packages] = positionals;
  if (
    (command !== 'init' && command !== 'install') ||
    (command === 'init' && packages.length !== 0) ||
    (command === 'install' && packages.length === 0)
  ) {
    throw new Error('Expected init or install <package...>. Run with --help for usage.');
  }
  const frozen = values['frozen-lockfile'] ?? false;
  if (command === 'install' && frozen) {
    throw new Error(
      'install changes dependencies and cannot use --frozen-lockfile. Use init --frozen-lockfile to reproduce a committed dependency tree.'
    );
  }
  root = findAppRoot(process.cwd());
  const settingsPath = join(root, '.expo-source/setup.json');
  const saved: Partial<SetupSettings> = existsSync(settingsPath) ? readJSON(settingsPath) : {};
  const configPath = join(root, 'expo-embedding.json');
  const config: Partial<SetupSettings> = existsSync(configPath) ? readJSON(configPath) : {};
  const candidates = readdirSync(root).filter((name) => name.endsWith('.xcodeproj'));
  if (values.platform && values.platform !== 'ios')
    throw new Error('This integration supports --platform ios.');
  const project =
    values.project ??
    config.project ??
    saved.project ??
    (candidates.length === 1 ? candidates[0] : undefined);
  if (!project || !existsSync(resolve(root, project, 'project.pbxproj'))) {
    throw new Error(
      'Could not select an Xcode project. Pass --project with the app .xcodeproj path.'
    );
  }
  const node = process.execPath;
  const env = { ...process.env };
  const target = values.target ?? config.target ?? saved.target ?? '';
  const nativeOptions = {
    root,
    project: resolve(root, project ?? ''),
    target,
    templates: join(packageRoot, 'templates/ios'),
    node,
  };
  validateSourceProject(nativeOptions);

  const isNewExpoProject = !existsSync(join(root, 'expo/package.json'));
  if (isNewExpoProject) {
    if (frozen)
      throw new Error(
        'No Expo app exists for a frozen install. Run init locally and commit expo/package.json and its lockfile first.'
      );
    if (command !== 'init') {
      throw new Error(
        'No Expo app exists yet. Run npx expo-embedding init before installing packages.'
      );
    }
    const versions = {
      expo: '58.0.14',
      react: '19.3.0',
      'react-native': '0.88.0',
    };
    scaffoldExpoProject(root, versions);
    process.stdout.write('Created expo/ with a Main scene.\n');
  } else if (command === 'init') {
    scaffoldExpoProject(root, {});
  }
  const projectRoot = join(root, 'expo');
  const installRoot = projectRoot;
  const manager = getPackageManager(installRoot);
  const installArguments = getInstallArguments(installRoot, manager, frozen);
  const backup = detachSharedNodeModules(projectRoot, frozen);
  if (backup)
    process.stdout.write(
      `Backed up shared dependency links and any legacy linked lockfiles to ${backup}. Installing app-owned dependencies.\n`
    );
  process.stdout.write(`Installing dependencies from expo/package.json with ${manager}…\n`);
  run(manager, installArguments, env, installRoot);
  const requireFromApp = createRequire(join(projectRoot, 'package.json'));
  const expoRoot = dirname(requireFromApp.resolve('expo/package.json'));
  if (command === 'install') {
    process.stdout.write(`Installing ${packages.join(', ')} in expo/…\n`);
    run(
      node,
      [join(expoRoot, 'bin/cli'), 'install', `--${manager}`, ...packages],
      env,
      projectRoot
    );
    installationCompleted = true;
    process.stdout.write('Dependencies installed. Refreshing the native integration…\n');
  }
  const nativePlan = discoverNativeModules(projectRoot);
  const rn = nativePlan.reactNativeRoot;
  const reactNative = readJSON(join(rn, 'package.json')).version;
  const hermes = readFileSync(join(rn, 'sdks/hermes-engine/version.properties'), 'utf8')
    .match(/^HERMES_VERSION_NAME=(.+)$/m)?.[1]
    .trim();
  if (!hermes)
    throw new Error(
      'Hermes version is missing from the installed React Native package. Reinstall the dependencies in expo/ and rerun init.'
    );
  const cache = join(homedir(), 'Library/Caches/ReactNative');
  for (const configuration of ['Debug', 'Release']) {
    const flavor = configuration.toLowerCase();
    const output = join(root, '.expo-source/runtime', configuration);
    const stamp = join(output, '.versions.json');
    if (existsSync(stamp)) {
      const previous = readJSON(stamp);
      if (previous.reactNative === reactNative && previous.hermes === hermes) continue;
    }
    const archives = [
      ['reactnative-core', reactNative],
      ['reactnative-dependencies', reactNative],
      ['hermes-ios', hermes],
    ].map(([name, version]) => join(cache, `${name}-${version}-${flavor}.tar.gz`));
    if (!archives.every(existsSync)) {
      run(node, [
        join(rn, 'scripts/spm/download-spm-artifacts.js'),
        '--version',
        reactNative,
        '--flavor',
        flavor,
        '--output',
        join(root, '.expo-source/downloads', flavor),
      ]);
    }
    mkdirSync(output, { recursive: true });
    for (const archive of archives) {
      if (!existsSync(archive))
        throw new Error(
          `Runtime archive is missing: ${archive}. Check the artifact downloader output and rerun init.`
        );
      run('tar', ['-xzf', archive, '-C', output]);
    }
    writeFileSync(stamp, JSON.stringify({ reactNative, hermes }));
  }
  const metroConfig = join(root, 'expo/metro.config.js');
  if (!existsSync(metroConfig))
    writeIfChanged(
      metroConfig,
      "const { getDefaultConfig } = require('expo/metro-config');\n" +
        'module.exports = getDefaultConfig(__dirname);\n'
    );
  const generatedPaths = [
    'scripts',
    'native-modules.json',
    'Host',
    'headers',
    'resources',
    'modulemaps',
    'ExpoEmbedding.xcodeproj',
    'embed-frameworks.sh',
    'setup.json',
  ];
  withGenerationRollback(
    [
      resolve(root, project!, 'project.pbxproj'),
      ...generatedPaths.map((path) => join(root, '.expo-source', path)),
    ],
    () => {
      const codegen = join(root, '.expo-source/scripts/codegen.cjs');
      mkdirSync(dirname(codegen), { recursive: true });
      writeIfChanged(codegen, readFileSync(join(packageRoot, 'scripts/codegen.cjs'), 'utf8'));
      writeIfChanged(
        join(dirname(codegen), 'embed-frameworks.sh'),
        readFileSync(join(packageRoot, 'scripts/embed-frameworks.sh'), 'utf8')
      );
      writeIfChanged(
        join(dirname(codegen), 'native.cjs'),
        readFileSync(join(packageRoot, 'build/native.cjs'), 'utf8')
      );
      rmSync(join(dirname(codegen), 'read-podspec.rb'), { force: true });
      const nativePlanPath = join(root, '.expo-source/native-modules.json');
      writeIfChanged(nativePlanPath, JSON.stringify(nativePlan, null, 2) + '\n');
      run(node, [codegen, root]);
      configureSourceProject(nativeOptions, nativePlan);
      writeIfChanged(settingsPath, JSON.stringify({ project, target }, null, 2) + '\n');
    }
  );
  process.stdout.write(`Open ${project}, select an iOS simulator, and press Run.\n`);
  if (command === 'init' && isNewExpoProject) {
    process.stdout.write(
      'SwiftUI: import expoappbrownfield, own an ExpoHost, forward the app delegate with ExpoBrownfieldAppDelegate,\n' +
        'attach .expoHost(host) to your root view, and display ExpoScene(name: "Main").frame(height: 240).\n'
    );
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  if (installationCompleted) {
    process.stderr.write(
      'Dependency installation succeeded, but native setup did not finish. Fix the error above, then run init to retry native setup using the updated package manifest.\n'
    );
  }
  process.exitCode = 1;
});
