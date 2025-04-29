import { RunOptions } from '@expo/config';
import fs from 'fs';

import { hasDirectDevClientDependency } from '../../start/detectDevClient';

export function isDevClientBuild({
  runOptions,
  projectRoot,
}: {
  runOptions: RunOptions;
  projectRoot: string;
}) {
  if (!hasDirectDevClientDependency(projectRoot)) {
    return false;
  }

  if ('variant' in runOptions && runOptions.variant !== undefined) {
    return runOptions.variant === 'debug';
  }
  if ('configuration' in runOptions && runOptions.configuration !== undefined) {
    return runOptions.configuration === 'Debug';
  }

  return true;
}

export function moduleNameIsDirectFileReference(name: string): boolean {
  // Check if path is a file. Matches lines starting with: . / ~/
  if (name.match(/^(\.|~\/|\/)/g)) {
    return true;
  }

  const slashCount = name.split('/')?.length;
  // Orgs (like @expo/config ) should have more than one slash to be a direct file.
  if (name.startsWith('@')) {
    return slashCount > 2;
  }

  // Regular packages should be considered direct reference if they have more than one slash.
  return slashCount > 1;
}

export function moduleNameIsPackageReference(name: string): boolean {
  const slashCount = name.split('/')?.length;
  return name.startsWith('@') ? slashCount === 2 : slashCount === 1;
}

export function fileExists(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
