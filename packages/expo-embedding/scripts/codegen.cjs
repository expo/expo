const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const appRoot = path.resolve(process.argv[2]);
const projectRoot = path.join(appRoot, 'expo');
process.chdir(projectRoot);
const { discoverNativeModules, generateModulesProvider } = require('./native.cjs');
const nativePlan = discoverNativeModules(projectRoot);
const savedPlan = JSON.parse(
  fs.readFileSync(path.join(appRoot, '.expo-source/native-modules.json'), 'utf8')
);
if (JSON.stringify(nativePlan) !== JSON.stringify(savedPlan)) {
  throw new Error(
    'Native dependencies or source files changed since setup. Run npx expo-embedding init from the app directory, then rebuild in Xcode.'
  );
}
generateModulesProvider(
  projectRoot,
  path.join(appRoot, '.expo-source/Host/ExpoModulesProvider.swift'),
  nativePlan
);
const reactNativeRoot = path.dirname(
  require.resolve('react-native/package.json', { paths: [projectRoot] })
);
const expoRoot = path.dirname(require.resolve('expo/package.json', { paths: [projectRoot] }));
const autolinkingRoot = path.dirname(
  require.resolve('expo-modules-autolinking/package.json', {
    paths: [expoRoot],
  })
);
const config = execFileSync(
  process.execPath,
  [
    path.join(autolinkingRoot, 'bin/expo-modules-autolinking.js'),
    'react-native-config',
    '--platform',
    'ios',
    '--project-root',
    projectRoot,
    '--json',
  ],
  { encoding: 'utf8', cwd: projectRoot }
);
const output = path.join(appRoot, '.expo-source/build/generated/autolinking/autolinking.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== config) {
  fs.writeFileSync(output, config);
}
const executor = require(path.join(reactNativeRoot, 'scripts/codegen/generate-artifacts-executor'));
executor.execute(projectRoot, 'ios', path.join(appRoot, '.expo-source'), 'app', true);
