import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import {
  configureSourceProject,
  validateSourceProject,
  type SourceProjectOptions,
} from './configure-source';
import { exists, readJSON, readText, writeGenerated } from './files';
import { withGenerationRollback } from './generation';
import { discoverNativeModules } from './native';
import { runCommand } from './process';

type SetupSettings = { project: string; target: string };

export async function prepareIos(
  root: string,
  packageRoot: string,
  values: Partial<SetupSettings>
): Promise<SourceProjectOptions> {
  const settingsPath = join(root, '.expo-source/setup.json');
  const saved: Partial<SetupSettings> = (await exists(settingsPath))
    ? await readJSON(settingsPath)
    : {};
  const configPath = join(root, 'expo-embedding.json');
  const config: Partial<SetupSettings> = (await exists(configPath))
    ? await readJSON(configPath)
    : {};
  const candidates = (await readdir(root)).filter((name) => name.endsWith('.xcodeproj'));
  const project =
    values.project ??
    config.project ??
    saved.project ??
    (candidates.length === 1 ? candidates[0] : undefined);
  if (!project || !(await exists(resolve(root, project, 'project.pbxproj')))) {
    throw new Error(
      'Could not select an Xcode project. Pass --project with the app .xcodeproj path.'
    );
  }
  const node = process.execPath;
  const target = values.target ?? config.target ?? saved.target ?? '';
  const nativeOptions = {
    root,
    project: resolve(root, project ?? ''),
    target,
    templates: join(packageRoot, 'templates/ios'),
    node,
  };
  await validateSourceProject(nativeOptions);
  return nativeOptions;
}

async function prepareRuntime(
  root: string,
  node: string,
  nativePlan: Awaited<ReturnType<typeof discoverNativeModules>>
): Promise<void> {
  const rn = nativePlan.reactNativeRoot;
  const reactNative = (await readJSON(join(rn, 'package.json'))).version;
  const hermes = (await readText(join(rn, 'sdks/hermes-engine/version.properties')))
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
    if (await exists(stamp)) {
      const previous = await readJSON(stamp);
      if (previous.reactNative === reactNative && previous.hermes === hermes) continue;
    }
    const archives = [
      ['reactnative-core', reactNative],
      ['reactnative-dependencies', reactNative],
      ['hermes-ios', hermes],
    ].map(([name, version]) => join(cache, `${name}-${version}-${flavor}.tar.gz`));
    if (!(await Promise.all(archives.map(exists))).every(Boolean)) {
      await runCommand(
        node,
        [
          join(rn, 'scripts/spm/download-spm-artifacts.js'),
          '--version',
          reactNative,
          '--flavor',
          flavor,
          '--output',
          join(root, '.expo-source/downloads', flavor),
        ],
        { cwd: root }
      );
    }
    await mkdir(output, { recursive: true });
    for (const archive of archives) {
      if (!(await exists(archive)))
        throw new Error(
          `Runtime archive is missing: ${archive}. Check the artifact downloader output and rerun init.`
        );
      await runCommand('tar', ['-xzf', archive, '-C', output], { cwd: root });
    }
    await writeFile(stamp, JSON.stringify({ reactNative, hermes }));
  }
}

export async function initializeIos(
  options: SourceProjectOptions,
  packageRoot: string
): Promise<void> {
  const { root, project, target, node } = options;
  const nativePlan = await discoverNativeModules(join(root, 'expo'));
  await prepareRuntime(root, node, nativePlan);
  const metroConfig = join(root, 'expo/metro.config.js');
  if (!(await exists(metroConfig)))
    await writeGenerated(
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
  await withGenerationRollback(
    [
      join(project, 'project.pbxproj'),
      ...generatedPaths.map((path) => join(root, '.expo-source', path)),
    ],
    async () => {
      const codegen = join(root, '.expo-source/scripts/codegen.cjs');
      await mkdir(dirname(codegen), { recursive: true });
      await writeGenerated(codegen, await readText(join(packageRoot, 'scripts/codegen.cjs')));
      await writeGenerated(
        join(dirname(codegen), 'embed-frameworks.sh'),
        await readText(join(packageRoot, 'scripts/embed-frameworks.sh'))
      );
      await writeGenerated(
        join(dirname(codegen), 'native.cjs'),
        await readText(join(packageRoot, 'build/native.cjs'))
      );
      await rm(join(dirname(codegen), 'read-podspec.rb'), { force: true });
      const nativePlanPath = join(root, '.expo-source/native-modules.json');
      await writeGenerated(nativePlanPath, JSON.stringify(nativePlan, null, 2) + '\n');
      await runCommand(node, [codegen, root], { cwd: root });
      await configureSourceProject(options, nativePlan);
      await writeGenerated(
        join(root, '.expo-source/setup.json'),
        JSON.stringify({ project, target }, null, 2) + '\n'
      );
    }
  );
  process.stdout.write(`Open ${project}, select an iOS simulator, and press Run.\n`);
}
