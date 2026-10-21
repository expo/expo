import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findAppRoot, scaffoldExpoProject } from '../scaffold';

let root: string;
const versions = { expo: '58.0.14', react: '19.3.0', 'react-native': '0.88.0' };

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'expo-scaffold-test-'));
  mkdirSync(join(root, 'App.xcodeproj'));
  writeFileSync(join(root, 'App.xcodeproj/project.pbxproj'), 'project');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('Scaffolding Expo in SwiftUI projects', () => {
  it('should discover a fresh host from a source subdirectory', () => {
    mkdirSync(join(root, 'App'));
    expect(findAppRoot(join(root, 'App'))).toBe(root);
  });

  it('should create a working starter and ignore generated files', () => {
    scaffoldExpoProject(root, versions);
    const manifest = JSON.parse(readFileSync(join(root, 'expo/package.json'), 'utf8'));
    expect(manifest.dependencies).toEqual(versions);
    expect(manifest.main).toBe('index.js');
    expect(readFileSync(join(root, 'expo/index.js'), 'utf8')).toContain("registerComponent('Main'");
    expect(readFileSync(join(root, 'expo/App.tsx'), 'utf8')).toContain('Hello from Expo');
    expect(existsSync(join(root, 'expo/Native/ExpoExampleModule.swift'))).toBe(true);
    expect(readFileSync(join(root, 'expo/react-native.config.js'), 'utf8')).toContain('ios: null');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('/.expo-source/');
  });

  it('should preserve edits and avoid duplicate ignore entries on repeated init', () => {
    scaffoldExpoProject(root, versions);
    writeFileSync(join(root, 'expo/App.tsx'), 'custom scene');
    const manifest = readFileSync(join(root, 'expo/package.json'), 'utf8');
    const ignores = readFileSync(join(root, '.gitignore'), 'utf8');
    scaffoldExpoProject(root, { ...versions, expo: '99.0.0' });
    expect(readFileSync(join(root, 'expo/App.tsx'), 'utf8')).toBe('custom scene');
    expect(readFileSync(join(root, 'expo/package.json'), 'utf8')).toBe(manifest);
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(ignores);
  });

  it('should leave an existing Expo app untouched and append to existing ignores', () => {
    mkdirSync(join(root, 'expo'));
    writeFileSync(join(root, 'expo/package.json'), '{"main":"custom.js"}');
    writeFileSync(join(root, 'expo/custom.js'), 'custom entry');
    writeFileSync(join(root, '.gitignore'), 'my-private-file');
    scaffoldExpoProject(root, versions);
    expect(readFileSync(join(root, 'expo/package.json'), 'utf8')).toBe('{"main":"custom.js"}');
    expect(existsSync(join(root, 'expo/index.js'))).toBe(false);
    expect(existsSync(join(root, 'expo/Native'))).toBe(false);
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(/^my-private-file\n/);
  });

  it('should reject an occupied expo directory without overwriting it', () => {
    mkdirSync(join(root, 'expo'));
    writeFileSync(join(root, 'expo/index.js'), 'existing work');
    expect(() => scaffoldExpoProject(root, versions)).toThrow('not empty');
    expect(readFileSync(join(root, 'expo/index.js'), 'utf8')).toBe('existing work');
    expect(existsSync(join(root, 'expo/package.json'))).toBe(false);
  });

  it('should reject a directory with no host project', () => {
    rmSync(join(root, 'App.xcodeproj'), { recursive: true });
    expect(() => findAppRoot(root)).toThrow('Xcode project');
  });
});
