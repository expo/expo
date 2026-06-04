import type { ProjectSnapshot, SandboxPreset } from './types';

type PackageJson = {
  scripts?: Record<string, unknown>;
};

function hasFile(snapshot: ProjectSnapshot, path: string): boolean {
  return snapshot.files[path] != null;
}

function readPackageJson(snapshot: ProjectSnapshot): PackageJson | null {
  const packageJson = snapshot.files['package.json'];
  if (!packageJson) {
    return null;
  }
  try {
    return JSON.parse(packageJson);
  } catch {
    return null;
  }
}

function hasScript(packageJson: PackageJson | null, scriptName: string): boolean {
  return typeof packageJson?.scripts?.[scriptName] === 'string';
}

export function selectSandboxPresets(snapshot: ProjectSnapshot): SandboxPreset[] {
  const presets: SandboxPreset[] = ['checkout'];
  const packageJson = readPackageJson(snapshot);

  if (
    packageJson ||
    hasFile(snapshot, 'package-lock.json') ||
    hasFile(snapshot, 'npm-shrinkwrap.json') ||
    hasFile(snapshot, 'pnpm-lock.yaml') ||
    hasFile(snapshot, 'yarn.lock') ||
    hasFile(snapshot, 'bun.lock') ||
    hasFile(snapshot, 'bun.lockb')
  ) {
    presets.push('node_install');
  }

  if (hasScript(packageJson, 'test')) {
    presets.push('node_test');
  }
  if (hasScript(packageJson, 'lint')) {
    presets.push('node_lint');
  }
  if (hasScript(packageJson, 'typecheck') || hasFile(snapshot, 'tsconfig.json')) {
    presets.push('node_typecheck');
  }
  if (hasFile(snapshot, 'gradlew')) {
    presets.push('gradle_check');
  }
  if (hasFile(snapshot, 'Package.swift')) {
    presets.push('swift_check');
  }
  if (hasFile(snapshot, 'CMakeLists.txt')) {
    presets.push('cpp_check');
  }

  return presets;
}

export function getSandboxSnapshotPaths(): string[] {
  return [
    'package.json',
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
    'tsconfig.json',
    'gradlew',
    'Package.swift',
    'CMakeLists.txt',
  ];
}
