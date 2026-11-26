import fs from 'fs';
import os from 'os';
import path from 'path';

import { discoverExpoModuleConfigAsync } from '../../ExpoModuleConfig';
import type { ModuleDescriptorIos } from '../../types';
import { generateModulesProviderAsync, resolveModuleAsync } from '../apple/apple';

jest.unmock('fs');
jest.unmock('fs/promises');

const packagesDir = path.resolve(__dirname, '../../../..');
const debugOnlyPackageNames = ['expo-dev-launcher', 'expo-dev-menu', 'expo-dev-menu-interface'];

async function resolveRealPackageAsync(packageName: string): Promise<ModuleDescriptorIos> {
  const packagePath = path.join(packagesDir, packageName);
  const config = (await discoverExpoModuleConfigAsync(packagePath)) ?? undefined;
  const descriptor = await resolveModuleAsync(
    packageName,
    { name: packageName, path: packagePath, version: '0.0.0', config },
    { scannedModules: null }
  );
  if (!descriptor) {
    throw new Error(`${packageName} has no podspec`);
  }
  return descriptor;
}

/** The Swift module name that CocoaPods gives the pod: `module_name`, else `header_dir`. */
function podSwiftModuleName(podspecPath: string): string | undefined {
  const podspec = fs.readFileSync(podspecPath, 'utf8');
  return (podspec.match(/\.module_name\s*=\s*['"](\w+)['"]/) ??
    podspec.match(/\.header_dir\s*=\s*['"](\w+)['"]/))?.[1];
}

function swiftSources(packageName: string): string[] {
  const iosDir = path.join(packagesDir, packageName, 'ios');
  return fs
    .readdirSync(iosDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.swift') && !file.startsWith(`Tests${path.sep}`))
    .map((file) => fs.readFileSync(path.join(iosDir, file), 'utf8'));
}

/** The attributes of each top-level declaration of the class, or an empty list when there is none. */
function classDeclarationAttributes(source: string, className: string): string[] {
  const lines = source.split('\n');
  const declaration = new RegExp(
    `^(?:@\\S+\\s+)*(?:(?:public|open|final|internal)\\s+)*class\\s+${className}\\b`
  );
  return lines.flatMap((line, index) => {
    if (!declaration.test(line)) {
      return [];
    }
    let start = index;
    while (start > 0 && lines[start - 1]!.trimStart().startsWith('@')) {
      start--;
    }
    return [lines.slice(start, index + 1).join('\n')];
  });
}

describe('provider for the debug-only Expo packages', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-modules-provider-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('looks up each class by the runtime name of a top-level Swift class in its package', async () => {
    const descriptors = await Promise.all(debugOnlyPackageNames.map(resolveRealPackageAsync));
    expect(descriptors.every((descriptor) => descriptor.debugOnly)).toBe(true);

    const targetPath = path.join(tmpDir, 'ExpoModulesProvider.swift');
    await generateModulesProviderAsync(descriptors, targetPath, null, {
      watchedDirectories: [],
      inlineModulesTargets: { targets: [] },
      targetPath,
      appRoot: tmpDir,
      corePath: path.join(packagesDir, 'expo-modules-core'),
    });
    const provider = fs.readFileSync(targetPath, 'utf8');
    const runtimeNames = [...provider.matchAll(/NSClassFromString\("([^"]+)"\)/g)].map(
      (match) => match[1]!
    );
    expect(runtimeNames).not.toHaveLength(0);

    for (const runtimeName of new Set(runtimeNames)) {
      const [swiftModuleName, className] = runtimeName.split('.') as [string, string];
      const descriptor = descriptors.find(({ swiftModuleNames }) =>
        swiftModuleNames.includes(swiftModuleName)
      );
      if (!descriptor) {
        throw new Error(`No debug-only package has the Swift module of ${runtimeName}`);
      }
      const { packageName, pods } = descriptor;
      const config = JSON.parse(
        fs.readFileSync(path.join(packagesDir, packageName, 'expo-module.config.json'), 'utf8')
      );
      const declarations = swiftSources(packageName).flatMap((source) =>
        classDeclarationAttributes(source, className)
      );

      expect({
        runtimeName,
        configSwiftModuleName: config.apple.swiftModuleName,
        podSwiftModuleName: podSwiftModuleName(
          path.join(pods[0]!.podspecDir, `${pods[0]!.podName}.podspec`)
        ),
        topLevelDeclarations: declarations.length,
        renamedForObjectiveC: declarations.some((attributes) => /@objc\(/.test(attributes)),
      }).toEqual({
        runtimeName,
        configSwiftModuleName: swiftModuleName,
        podSwiftModuleName: swiftModuleName,
        topLevelDeclarations: 1,
        renamedForObjectiveC: false,
      });
    }
  });
});
