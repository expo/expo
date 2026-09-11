import fs from 'fs-extra';
import path from 'path';

import type { XCFrameworkVerificationResult } from './Verifier.types';

/**
 * Swift Testing modules ship with the toolchain, not with the SDK, so an app that links a
 * prebuilt framework cannot resolve them. Any of them reaching a shipped `.swiftinterface`
 * means unit tests were compiled into the framework.
 */
const TEST_ONLY_IMPORT_REGEX =
  /^[ \t]*(?:@\w+(?:\([^)]*\))?[ \t]+)*(?:public|package|internal)?[ \t]*import[ \t]+(Testing|_Testing_\w+)\b/;

const HOW_TO_FIX =
  'Unit tests were compiled into the framework: a test directory not named `Tests` ' +
  '(for example `Test/`, `tests/`, `UnitTests/`), or a non-test source that imports Testing. ' +
  'Move test sources under `Tests/`, or add the directory to the target’s `exclude` in ' +
  'spm.config.json, then rebuild.';

/**
 * Returns the test-only modules imported by a `.swiftinterface`, in order of first appearance.
 */
export function findTestOnlyImports(interfaceContents: string): string[] {
  const modules = new Set<string>();
  for (const line of interfaceContents.split('\n')) {
    const match = line.match(TEST_ONLY_IMPORT_REGEX);
    if (match) {
      modules.add(match[1]);
    }
  }
  return [...modules];
}

/**
 * Checks every `.swiftinterface` inside a built `.framework` for test-only imports. Apps linking
 * the framework cannot resolve those modules, so shipping one breaks every consumer's build.
 */
export function verifyNoTestOnlyImports(frameworkPath: string): XCFrameworkVerificationResult {
  const modules = new Map<string, string[]>();

  for (const interfacePath of findSwiftInterfaces(frameworkPath)) {
    const testOnlyImports = findTestOnlyImports(fs.readFileSync(interfacePath, 'utf8'));
    if (testOnlyImports.length > 0) {
      modules.set(path.basename(interfacePath), testOnlyImports);
    }
  }

  if (modules.size === 0) {
    return { success: true, message: 'No test-only imports' };
  }

  const interfaceNames = [...modules.keys()].join(', ');
  const importedModules = [...new Set([...modules.values()].flat())].join(', ');
  return {
    success: false,
    message: `Test-only imports in ${interfaceNames}: ${importedModules}`,
    details:
      `${interfaceNames} imports test-only modules (${importedModules}), so every app linking ` +
      `this prebuilt framework would fail with "unable to resolve module dependency: Testing". ` +
      HOW_TO_FIX,
  };
}

function findSwiftInterfaces(frameworkPath: string): string[] {
  const modulesPath = path.join(frameworkPath, 'Modules');
  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  return fs
    .readdirSync(modulesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.swiftmodule'))
    .flatMap((swiftModule) => {
      const swiftModulePath = path.join(modulesPath, swiftModule.name);
      return fs
        .readdirSync(swiftModulePath)
        .filter((file) => file.endsWith('.swiftinterface'))
        .map((file) => path.join(swiftModulePath, file));
    });
}
