import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

import { EXPO_DIR, EXPOTOOLS_DIR } from '../Constants';
import { getListOfPackagesAsync, Package } from '../Packages';
import {
  createAndroidPublicationManifest,
  removeNondeterministicMavenMetadataAsync,
  validateAndroidPublicationRepositoryAsync,
} from '../prebuilds/AndroidPrebuilds';

const COPY_FILTER = (source: string): boolean => {
  const basename = path.basename(source);
  return ![
    '.expo-prebuild',
    '.expo-prebuild-android',
    '.git',
    '.gradle',
    'build',
    'local-maven-repo',
    'node_modules',
    'prebuilds',
  ].includes(basename);
};

function androidProjects(pkg: Package) {
  const config = pkg.expoModuleConfig;
  if (!config?.platforms.includes('android')) {
    throw new Error(`${pkg.packageName} is not an Android Expo module`);
  }
  const projects = [
    {
      projectName: config.android?.name ?? pkg.packageName.replace(/^@/, '').replace(/\W+/g, '-'),
      publication: config.android?.publication,
    },
  ];
  for (const project of config.android?.projects ?? []) {
    if (project.name)
      projects.push({ projectName: project.name, publication: project.publication });
  }
  return projects;
}

async function resolveNativeClosureAsync(target: Package): Promise<Package[]> {
  const workspacePackages = await getListOfPackagesAsync();
  const byName = new Map(workspacePackages.map((pkg) => [pkg.packageName, pkg]));
  const result = new Map<string, Package>();
  const pending = [target.packageName, 'expo-modules-core'];

  while (pending.length > 0) {
    const name = pending.pop()!;
    if (result.has(name)) continue;
    const pkg = byName.get(name);
    if (!pkg?.expoModuleConfig?.platforms.includes('android')) continue;
    result.set(name, pkg);
    for (const dependency of Object.keys(pkg.packageJson.dependencies ?? {})) {
      if (byName.has(dependency)) pending.push(dependency);
    }
  }
  return [...result.values()].sort((a, b) => a.packageName.localeCompare(b.packageName));
}

async function resolveReactNativeAsync(projectRoot: string): Promise<{
  pluginDirectory: string;
  version: string;
}> {
  const packageJsonPath = require.resolve('react-native/package.json', { paths: [projectRoot] });
  const packageJson = await fs.readJson(packageJsonPath);
  const pluginPackageJsonPath = require.resolve('@react-native/gradle-plugin/package.json', {
    paths: [packageJsonPath],
  });
  return {
    pluginDirectory: path.dirname(pluginPackageJsonPath),
    version: packageJson.version,
  };
}

export async function prebuildAndroidPackageForPublishAsync(packageRoot = process.cwd()) {
  const pkg = new Package(packageRoot);
  if (!pkg.scripts['precompile-android']) {
    throw new Error(`${pkg.packageName} does not declare a precompile-android script`);
  }

  const projects = androidProjects(pkg);
  const manifest = createAndroidPublicationManifest(pkg.packageName, pkg.packageVersion, projects);
  const closure = await resolveNativeClosureAsync(pkg);
  const bareExpoRoot = path.join(EXPO_DIR, 'apps/bare-expo');
  const reactNative = await resolveReactNativeAsync(bareExpoRoot);
  const workRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), `expo-precompile-android-${pkg.packageName.replace(/\W/g, '-')}-`)
  );
  const hostRoot = path.join(workRoot, 'host');
  const modulesRoot = path.join(workRoot, 'modules');
  const pluginsRoot = path.join(workRoot, 'plugins');
  const repositoryRoot = path.join(workRoot, 'repository');
  const outputRoot = path.join(pkg.path, '.expo-prebuild-android');

  try {
    await Promise.all([
      fs.copy(path.join(EXPOTOOLS_DIR, 'android-precompile'), hostRoot, { filter: COPY_FILTER }),
      fs.copy(
        path.join(EXPO_DIR, 'packages/expo-modules-autolinking/android/expo-gradle-plugin'),
        path.join(pluginsRoot, 'expo-gradle-plugin'),
        { filter: COPY_FILTER }
      ),
      fs.copy(reactNative.pluginDirectory, path.join(pluginsRoot, 'react-native-gradle-plugin'), {
        filter: COPY_FILTER,
      }),
      ...closure.map(async (dependency) => {
        const destination = path.join(
          modulesRoot,
          dependency.packageName.replace(/^@/, '').replace('/', '-')
        );
        await fs.copy(dependency.path, destination, { filter: COPY_FILTER });
        const dependencyNodeModules = path.join(dependency.path, 'node_modules');
        if (await fs.pathExists(dependencyNodeModules)) {
          await fs.symlink(dependencyNodeModules, path.join(destination, 'node_modules'));
        }
      }),
    ]);
    await fs.symlink(path.join(bareExpoRoot, 'node_modules'), path.join(hostRoot, 'node_modules'));

    const properties = [
      `-Pexpo.precompileAndroid.reactNativePlugin=${path.join(pluginsRoot, 'react-native-gradle-plugin')}`,
      `-Pexpo.precompileAndroid.expoPlugin=${path.join(pluginsRoot, 'expo-gradle-plugin')}`,
      `-Pexpo.precompileAndroid.modulesDirectory=${modulesRoot}`,
      `-Pexpo.precompileAndroid.reactNativeVersion=${reactNative.version}`,
      `-Pexpo.precompileAndroid.repository=${repositoryRoot}`,
    ];
    const tasks = projects.map(
      ({ projectName }) => `:${projectName}:publishReleasePublicationToNPMPackageRepository`
    );
    await spawnAsync(
      path.join(EXPO_DIR, 'apps/bare-expo/android/gradlew'),
      [
        '-p',
        hostRoot,
        ...tasks,
        '--no-daemon',
        '--no-build-cache',
        '--no-configuration-cache',
        '--no-watch-fs',
        '--project-cache-dir',
        path.join(workRoot, 'project-cache'),
        ...properties,
      ],
      { cwd: EXPO_DIR, stdio: 'inherit' }
    );

    await validateAndroidPublicationRepositoryAsync(repositoryRoot, manifest);
    await removeNondeterministicMavenMetadataAsync(repositoryRoot);
    await fs.remove(outputRoot);
    await fs.ensureDir(outputRoot);
    await Promise.all([
      fs.copy(repositoryRoot, path.join(outputRoot, 'local-maven-repo')),
      fs.writeJson(path.join(outputRoot, 'publication.json'), manifest, { spaces: 2 }),
    ]);
  } finally {
    await fs.remove(workRoot);
  }
}

export default (program: Command) => {
  program
    .command('prebuild-android-package-for-publish')
    .description('Builds exactly the current package Android publication into its Turbo output.')
    .asyncAction(() => prebuildAndroidPackageForPublishAsync());
};
