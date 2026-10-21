import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findAppRoot(directory: string): string {
  let candidate = directory;
  while (true) {
    if (
      readdirSync(candidate).some(
        (name) =>
          name.endsWith('.xcodeproj') && existsSync(join(candidate, name, 'project.pbxproj'))
      )
    )
      return candidate;
    const parent = dirname(candidate);
    if (parent === candidate) {
      throw new Error(
        'Could not find an Xcode project. Run npx expo-embedding from your native app directory or one of its subdirectories.'
      );
    }
    candidate = parent;
  }
}

export function scaffoldExpoProject(root: string, versions: Record<string, string>): void {
  const directory = join(root, 'expo');
  if (!existsSync(join(directory, 'package.json'))) {
    if (existsSync(directory) && readdirSync(directory).length !== 0) {
      throw new Error(
        'Could not create the Expo starter because expo/ is not empty and has no package.json. Move its files aside or finish configuring that Expo app, then rerun init.'
      );
    }
    mkdirSync(join(directory, 'Native'), { recursive: true });
    for (const [name, contents] of Object.entries(starterFiles)) {
      writeFileSync(join(directory, name), contents, { flag: 'wx' });
    }
    writeFileSync(
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
  const previous = existsSync(ignorePath) ? readFileSync(ignorePath, 'utf8') : '';
  const lines = new Set(previous.split(/\r?\n/));
  const missing = [
    '/node_modules/',
    '/expo/node_modules/',
    '/expo/.expo/',
    '/.expo-source/',
  ].filter((line) => !lines.has(line));
  if (missing.length) {
    writeFileSync(
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
