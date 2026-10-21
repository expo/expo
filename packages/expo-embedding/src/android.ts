import { minimatch } from 'minimatch';
import { readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { HostFileChange } from './android-host';
import { getPackageManager } from './dependencies';
import { exists, lstatIfExists, readText as read, writeGenerated } from './files';
import { withGenerationRollback } from './generation';
import { validateVersions } from './native';
const quote = (value: string) => JSON.stringify(value).replace(/\$/g, '\\$');
const marker = (key: string, edge: string) => `// expo-embedding:${key}:${edge}`;
export async function prepareAndroidWorkspace(root: string, frozen: boolean): Promise<void> {
  if ((await lstatIfExists(join(root, 'node_modules')))?.isSymbolicLink())
    throw new Error(
      'Android setup cannot install into a shared node_modules symlink. Remove the root link and rerun init to install the declared dependencies locally.'
    );
  const path = join(root, 'package.json');
  const manifest = (await exists(path)) ? JSON.parse(await read(path)) : { private: true };
  for (const directory of [root, join(root, 'expo')]) {
    if (
      (await exists(join(directory, 'package.json'))) &&
      (await getPackageManager(directory)) !== 'npm'
    )
      throw new Error(
        'Android embedding currently requires an npm workspace. Migrate the host and expo/ package manifests to npm before running init.'
      );
  }
  const workspaces = manifest.workspaces ?? [];
  if (!Array.isArray(workspaces) || workspaces.some((value) => typeof value !== 'string'))
    throw new Error(
      'Android embedding needs a workspaces array in package.json. Convert the workspace declaration to npm array syntax and rerun init.'
    );
  const hasWorkspace = workspaces.some(
    (pattern) => !pattern.startsWith('!') && minimatch('expo', pattern)
  );
  if (!hasWorkspace && frozen)
    throw new Error(
      'A frozen install cannot create the Android npm workspace. Run init locally and commit the root package.json and package-lock.json first.'
    );
  const expoManifestPath = join(root, 'expo/package.json');
  const expoManifest = (await exists(expoManifestPath))
    ? JSON.parse(await read(expoManifestPath))
    : undefined;
  const buildsFromSource =
    expoManifest?.expo?.autolinking?.android?.buildFromSource?.includes('.*');
  if (expoManifest && !buildsFromSource && frozen)
    throw new Error(
      'A frozen Android setup needs the source-build configuration in expo/package.json. Run init locally and commit that file first.'
    );
  if (!hasWorkspace) {
    manifest.workspaces = [...workspaces, 'expo'];
    await writeGenerated(path, JSON.stringify(manifest, null, 2) + '\n');
  }
  if (expoManifest && !buildsFromSource) {
    ((expoManifest.expo ??= {}).autolinking ??= {}).android ??= {};
    expoManifest.expo.autolinking.android.buildFromSource = ['.*'];
    await writeGenerated(expoManifestPath, JSON.stringify(expoManifest, null, 2) + '\n');
  }
}
export function androidDependenciesAreHoisted(root: string): boolean {
  try {
    const host = createRequire(join(root, 'package.json'));
    const app = createRequire(join(root, 'expo/package.json'));
    return ['expo', 'react', 'react-native'].every(
      (name) => host.resolve(`${name}/package.json`) === app.resolve(`${name}/package.json`)
    );
  } catch {
    return false;
  }
}
function managed(source: string, key: string, contents: string): string | undefined {
  const start = source.indexOf(marker(key, 'begin'));
  const end = source.indexOf(marker(key, 'end'));
  if (start < 0 !== end < 0 || (start >= 0 && end < start))
    throw new Error(`Incomplete expo-embedding ${key} block. Restore both markers and rerun init.`);
  if (start < 0) return undefined;
  if (
    source.indexOf(marker(key, 'begin'), start + 1) >= 0 ||
    source.indexOf(marker(key, 'end'), end + 1) >= 0
  )
    throw new Error(`Duplicate expo-embedding ${key} blocks. Keep one block and rerun init.`);
  return (
    source.slice(0, start) + wrap(key, contents) + source.slice(end + marker(key, 'end').length)
  );
}
function wrap(key: string, contents: string): string {
  return `${marker(key, 'begin')}\n${contents}\n${marker(key, 'end')}`;
}
function append(source: string, key: string, contents: string): string {
  return managed(source, key, contents) ?? `${source.trimEnd()}\n\n${wrap(key, contents)}\n`;
}
// Mask comments and strings before locating top-level Gradle blocks; never evaluate host scripts.
function blocks(source: string): {
  name: string;
  open: number;
  end: number;
}[] {
  const masked = source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (value) => value.replace(/[^\n]/g, ' ')
  );
  const stack: number[] = [];
  const result: {
    name: string;
    open: number;
    end: number;
  }[] = [];
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === '{') stack.push(i);
    else if (masked[i] === '}') {
      const open = stack.pop();
      if (open === undefined)
        throw new Error('Unbalanced Gradle braces. Fix the build script and rerun init.');
      if (!stack.length)
        result.push({
          name: masked.slice(0, open).match(/(\w+)\s*$/)?.[1] ?? '',
          open,
          end: i + 1,
        });
    }
  }
  if (stack.length)
    throw new Error('Unbalanced Gradle braces. Fix the build script and rerun init.');
  return result;
}
export function editGradleBlock(
  source: string,
  name: string,
  contents: string,
  key: string
): string {
  const ranges = blocks(source);
  const updated = managed(source, key, contents);
  if (updated !== undefined) return updated;
  const matches = ranges.filter((block) => block.name === name);
  if (matches.length > 1)
    throw new Error(`Multiple ${name} blocks. Combine them before running init.`);
  if (matches.length) {
    const index = matches[0].open + 1;
    return source.slice(0, index) + `\n${wrap(key, contents)}\n` + source.slice(index);
  }
  const after =
    name === 'plugins'
      ? Math.max(
          0,
          ...ranges
            .filter((block) => ['pluginManagement', 'buildscript'].includes(block.name))
            .map((block) => block.end)
        )
      : 0;
  return source.slice(0, after) + `\n${name} {\n${wrap(key, contents)}\n}\n` + source.slice(after);
}
async function gradleFile(directory: string, name: string): Promise<string> {
  const files: string[] = [];
  for (const file of [`${name}.gradle.kts`, `${name}.gradle`]) {
    const path = join(directory, file);
    if (await exists(path)) files.push(path);
  }
  if (files.length !== 1)
    throw new Error(
      `Expected one ${name}.gradle or ${name}.gradle.kts in ${directory}. Select a standard Gradle host project and rerun init.`
    );
  return files[0];
}
export async function prepareAndroidProject(root: string) {
  const settings = await gradleFile(root, 'settings');
  const build = await gradleFile(root, 'build');
  const app = await gradleFile(join(root, 'app'), 'build');
  for (const file of [settings, build, app]) blocks(await read(file));
  if (
    !(await read(app)).includes(marker('app', 'begin')) &&
    /com\.facebook\.react/.test(await read(app))
  )
    throw new Error(
      'An existing React Native integration was found in :app. Remove its Gradle wiring before using expo-embedding; init will not overwrite it.'
    );
  if (
    !(await read(settings)).includes(marker('settings', 'begin')) &&
    /expo-autolinking|expoEmbedding/.test(await read(settings))
  )
    throw new Error(
      'An existing Expo integration was found in settings. Remove its Gradle wiring before using expo-embedding.'
    );
  return { settings, build, app };
}
export async function configureAndroidProject(
  root: string,
  templates: string,
  node: string,
  hostChanges: HostFileChange[] = []
): Promise<void> {
  for (const change of hostChanges) {
    if (
      change.before === undefined
        ? (await lstatIfExists(change.path)) !== undefined
        : !(await exists(change.path)) || (await read(change.path)) !== change.before
    )
      throw new Error(
        `Host file changed after the migration preview: ${change.path}. Rerun init to review the current file before migrating it.`
      );
  }
  const paths = await prepareAndroidProject(root);
  const expo = join(root, 'expo');
  const require = createRequire(join(expo, 'package.json'));
  const packageRoot = (name: string) => dirname(require.resolve(`${name}/package.json`));
  validateVersions(
    Object.fromEntries(
      await Promise.all(
        ['expo', 'react', 'react-native'].map(async (name) => [
          name,
          JSON.parse(await read(join(packageRoot(name), 'package.json'))).version,
        ])
      )
    )
  );
  const rn = packageRoot('react-native');
  const autolinking = packageRoot('expo-modules-autolinking');
  const gradlePlugin = join(autolinking, 'android/expo-gradle-plugin');
  const generated = join(root, '.expo-source/android');
  const propertiesPath = join(root, 'gradle.properties');
  const properties = (await exists(propertiesPath)) ? await read(propertiesPath) : '';
  if (/^\s*(?:hermesEnabled|newArchEnabled)\s*=\s*false\s*$/m.test(properties))
    throw new Error(
      'Android embedding requires Hermes and the New Architecture. Remove the false override in gradle.properties and rerun init.'
    );
  const replacements: Record<string, string> = {
    ROOT: quote(root),
    EXPO: quote(expo),
    NODE: quote(node),
    RN: quote(rn),
    RN_GRADLE: quote(packageRoot('@react-native/gradle-plugin')),
    AUTOLINK: quote(join(autolinking, 'bin/expo-modules-autolinking.js')),
    CODEGEN: quote(packageRoot('@react-native/codegen')),
    EXPO_CLI: quote(join(packageRoot('expo'), 'bin/cli')),
    HERMESC: quote(
      join(
        packageRoot('hermes-compiler'),
        `hermesc/${process.platform === 'darwin' ? 'osx' : 'linux64'}-bin/hermesc`
      )
    ),
  };
  const generatedFiles = new Map<string, string>();
  async function copy(directory: string, relative = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = join(relative, entry.name);
      if (entry.isDirectory()) await copy(join(directory, entry.name), name);
      else
        generatedFiles.set(
          join(generated, name),
          (await read(join(directory, entry.name))).replace(/@@(\w+)@@/g, (_, key) => {
            if (!(key in replacements)) throw new Error(`Unknown Android template value ${key}`);
            return replacements[key];
          })
        );
    }
  }
  await copy(templates);
  let settings = editGradleBlock(
    await read(paths.settings),
    'pluginManagement',
    `includeBuild(${quote(packageRoot('@react-native/gradle-plugin'))})\nincludeBuild(${quote(gradlePlugin)})`,
    'plugin-management'
  );
  settings = editGradleBlock(
    settings,
    'plugins',
    'id("com.facebook.react.settings")\nid("expo-autolinking-settings")',
    'settings-plugins'
  );
  settings = append(
    settings,
    'settings',
    `apply(from = ${quote(join(generated, 'settings.gradle'))})`
  );
  if (!paths.settings.endsWith('.kts'))
    settings = settings.replace(
      `apply(from = ${quote(join(generated, 'settings.gradle'))})`,
      `apply from: ${quote(join(generated, 'settings.gradle'))}`
    );
  // Keep settings repositories authoritative while allowing Expo/RN plugins to declare theirs.
  settings = settings.replace(
    /RepositoriesMode\.FAIL_ON_PROJECT_REPOS/g,
    'RepositoriesMode.PREFER_SETTINGS'
  );
  const build = editGradleBlock(
    await read(paths.build),
    'plugins',
    'id("com.facebook.react.rootproject")\nid("expo-root-project")',
    'root-plugins'
  );
  let app = editGradleBlock(
    await read(paths.app),
    'plugins',
    'id("com.facebook.react")',
    'app-plugins'
  );
  app = append(
    app,
    'app',
    paths.app.endsWith('.kts')
      ? `apply(from = ${quote(join(generated, 'app.gradle'))})`
      : `apply from: ${quote(join(generated, 'app.gradle'))}`
  );
  const propertiesUpdated = append(
    properties.replace(/^# expo-embedding:/gm, '// expo-embedding:'),
    'android-properties',
    `expo.precompileAndroid.expoPlugin=${gradlePlugin}\nandroid.useAndroidX=true\nandroid.newDsl=false\nhermesEnabled=true\nnewArchEnabled=true`
  ).replace(/\/\/ expo-embedding:/g, '# expo-embedding:');
  const files = new Map([
    ...generatedFiles,
    ...hostChanges.map(({ path, after }) => [path, after] as [string, string]),
    [paths.settings, settings],
    [paths.build, build],
    [paths.app, app],
    [propertiesPath, propertiesUpdated],
  ]);
  const obsoleteSources = [
    join(generated, 'host/ExpoEmbeddingApplication.kt'),
    join(generated, 'library/src/main/java/expo/embedding/ExpoActivity.kt'),
  ];
  await withGenerationRollback([...files.keys(), ...obsoleteSources], async () => {
    for (const path of obsoleteSources) await rm(path, { force: true });
    for (const [path, contents] of files) {
      await writeGenerated(path, contents);
    }
  });
  process.stdout.write(
    'Configured Android :app with the separate :expoEmbedding module.\n' +
      'Follow .expo-source/android/INTEGRATION.md to attach ExpoActivityDelegate in your Activity, then sync Gradle and Run.\n'
  );
  if (hostChanges.length)
    process.stdout.write(
      `Configured Android host files:\n${hostChanges.map(({ path }) => `  ${path}`).join('\n')}\n` +
        'Review these host changes and commit them with your app. Verify with ./gradlew :app:assembleDebug, then launch the app to check its theme.\n'
    );
}
