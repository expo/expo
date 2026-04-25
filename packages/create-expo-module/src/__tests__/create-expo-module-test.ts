import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveLocalModuleDir } from '../create-expo-module';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-module-test-'));
}

function writePackageJson(dir: string, content: object): string {
  const filePath = path.join(dir, 'package.json');
  fs.writeFileSync(filePath, JSON.stringify(content));
  return filePath;
}

describe('resolveLocalModuleDir', () => {
  it('defaults to modules/ when no nativeModulesDir is configured', () => {
    const projectRoot = makeTmpDir();
    try {
      const packageJsonPath = writePackageJson(projectRoot, { name: 'my-app' });
      const result = resolveLocalModuleDir(packageJsonPath, 'my-module');
      expect(result).toBe(path.join(projectRoot, 'modules', 'my-module'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('uses nativeModulesDir from expo.autolinking when configured', () => {
    const projectRoot = makeTmpDir();
    try {
      const packageJsonPath = writePackageJson(projectRoot, {
        name: 'my-app',
        expo: { autolinking: { nativeModulesDir: 'native-modules' } },
      });
      const result = resolveLocalModuleDir(packageJsonPath, 'my-module');
      expect(result).toBe(path.resolve(projectRoot, 'native-modules', 'my-module'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('resolves nativeModulesDir as a path relative to the project root', () => {
    const projectRoot = makeTmpDir();
    try {
      const packageJsonPath = writePackageJson(projectRoot, {
        name: 'my-app',
        expo: { autolinking: { nativeModulesDir: 'packages/native' } },
      });
      const result = resolveLocalModuleDir(packageJsonPath, 'camera');
      expect(result).toBe(path.resolve(projectRoot, 'packages', 'native', 'camera'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('falls back to modules/ when expo config exists but autolinking is missing', () => {
    const projectRoot = makeTmpDir();
    try {
      const packageJsonPath = writePackageJson(projectRoot, {
        name: 'my-app',
        expo: { name: 'My App' },
      });
      const result = resolveLocalModuleDir(packageJsonPath, 'my-module');
      expect(result).toBe(path.join(projectRoot, 'modules', 'my-module'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('falls back to modules/ and prints a warning when package.json cannot be parsed', () => {
    const projectRoot = makeTmpDir();
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      fs.writeFileSync(packageJsonPath, 'this is not valid json');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = resolveLocalModuleDir(packageJsonPath, 'my-module');
      consoleSpy.mockRestore();

      expect(result).toBe(path.join(projectRoot, 'modules', 'my-module'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
