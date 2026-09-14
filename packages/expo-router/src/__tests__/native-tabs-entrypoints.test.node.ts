import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(__dirname, '../..');
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

it('exports native tabs from the stable entry point', () => {
  expect(packageJson.exports['./native-tabs']).toEqual({
    types: {
      'expo-source': './src/native-tabs/index.ts',
      default: './build/native-tabs/index.d.ts',
    },
    'expo-source': './src/native-tabs/index.ts',
    default: './build/native-tabs/index.js',
  });
});

it('keeps the unstable entry point as a deprecated alias', () => {
  expect(packageJson.exports['./unstable-native-tabs']).toEqual({
    types: {
      'expo-source': './src/unstable-native-tabs.ts',
      default: './build/unstable-native-tabs.d.ts',
    },
    'expo-source': './src/unstable-native-tabs.ts',
    default: './build/unstable-native-tabs.js',
  });

  const source = fs.readFileSync(path.join(packageRoot, 'src/unstable-native-tabs.ts'), 'utf8');
  expect(source).toContain('@deprecated Use `expo-router/native-tabs` instead.');
  expect(source).not.toContain('export *');
  expect(source).toContain("export { NativeTabs } from './native-tabs/NativeTabs'");
});
