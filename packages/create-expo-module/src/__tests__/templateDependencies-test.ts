import fs from 'node:fs';
import path from 'node:path';

// The release tooling keeps versions of packages from this repository up to date in the module
// template (see `tools/src/changesets/Versioning.ts`), and `et bump-rn` updates `react-native` and
// `@react-native/*`. React, `@types/react` and TypeScript must be updated by hand when upgrading them.

const ROOT = path.resolve(__dirname, '../../../..');

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readTemplateDevDependencies(): Record<string, string> {
  const template = fs.readFileSync(
    path.join(ROOT, 'packages/expo-module-template/$package.json'),
    'utf8'
  );
  // Drop the EJS control-flow lines (e.g. `<% if (usesExpoUI) { -%>`) to parse it as JSON.
  return JSON.parse(template.replace(/^<%.*%>\n/gm, '')).devDependencies;
}

describe('expo-module-template dependencies', () => {
  const devDependencies = readTemplateDevDependencies();
  const bundledNativeModules = readJson('packages/expo/bundledNativeModules.json');
  const appTemplate = readJson('templates/expo-template-blank-typescript/package.json');

  it.each(['react', 'react-native'])('uses the SDK version of %s', (name) => {
    expect(devDependencies[name]).toBe(bundledNativeModules[name]);
  });

  it('uses the @react-native/jest-preset version matching react-native', () => {
    expect(devDependencies['@react-native/jest-preset']).toBe(bundledNativeModules['react-native']);
  });

  // The example app is created from this app template, so it must use the same React Native.
  it.each(['react', 'react-native'])('uses the example app version of %s', (name) => {
    expect(devDependencies[name]).toBe(appTemplate.dependencies[name]);
  });

  it.each(['@types/react', 'typescript'])('uses the app template version of %s', (name) => {
    expect(devDependencies[name]).toBe(appTemplate.devDependencies[name]);
  });
});
