import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { exists, readText } from './files';
export async function findAppRoot(directory: string): Promise<string> {
  let candidate = directory;
  while (true) {
    let foundProject = false;
    for (const name of await readdir(candidate)) {
      if (name.endsWith('.xcodeproj') && (await exists(join(candidate, name, 'project.pbxproj')))) {
        foundProject = true;
        break;
      }
    }
    if (
      foundProject ||
      (await exists(join(candidate, 'settings.gradle.kts'))) ||
      (await exists(join(candidate, 'settings.gradle')))
    )
      return candidate;
    const parent = dirname(candidate);
    if (parent === candidate) {
      throw new Error(
        'Could not find an Xcode project or Android Gradle settings. Run npx expo-embedding from your native app directory or one of its subdirectories.'
      );
    }
    candidate = parent;
  }
}
export async function scaffoldExpoProject(
  root: string,
  versions: Record<string, string>,
  platform: 'ios' | 'android' = 'ios'
): Promise<void> {
  const directory = join(root, 'expo');
  if (!(await exists(join(directory, 'package.json')))) {
    if ((await exists(directory)) && (await readdir(directory)).length !== 0) {
      throw new Error(
        'Could not create the Expo starter because expo/ is not empty and has no package.json. Move its files aside or finish configuring that Expo app, then rerun init.'
      );
    }
    await mkdir(join(directory, 'Native'), { recursive: true });
    for (const [name, contents] of Object.entries(starterFiles)) {
      if (platform === 'android' && name.startsWith('Native/')) continue;
      if (platform === 'android' && name === 'react-native.config.js') {
        await writeFile(
          join(directory, name),
          "module.exports = { project: { android: { sourceDir: '..', appName: 'app' } } };\n",
          { flag: 'wx' }
        );
        continue;
      }
      await writeFile(join(directory, name), contents, { flag: 'wx' });
    }
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify(
        {
          name: 'expo-embedded-app',
          version: '1.0.0',
          private: true,
          main: 'index.js',
          dependencies: versions,
        },
        null,
        2
      ) + '\n',
      { flag: 'wx' }
    );
  }
  const ignorePath = join(root, '.gitignore');
  const previous = (await exists(ignorePath)) ? await readText(ignorePath) : '';
  const lines = new Set(previous.split(/\r?\n/));
  const missing = [
    '/node_modules/',
    '/expo/node_modules/',
    '/expo/.expo/',
    '/.expo-source/',
  ].filter((line) => !lines.has(line));
  if (missing.length) {
    await writeFile(
      ignorePath,
      previous + (previous && !previous.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n'
    );
  }
}
const starterFiles = {
  'index.js': `import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('Main', () => App);
`,
  'App.tsx': `import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello from Expo</Text>
      <Text>Count: {count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
});
`,
  'react-native.config.js': `// React core codegen is already part of the prebuilt runtime.
module.exports = {
  dependencies: { 'react-native': { platforms: { ios: null } } },
  project: { ios: { sourceDir: '..' } },
};
`,
  'Native/ExpoExampleModule.swift': `import ExpoModulesCore

public final class ExpoExampleModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoExample")
    Function("message") { "Expo native module: ready" }
  }
}
`,
};
