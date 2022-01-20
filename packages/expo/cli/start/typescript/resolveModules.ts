import * as path from 'path';
import resolveFrom from 'resolve-from';

import { fileExistsAsync } from '../../utils/dir';
import { everyMatchAsync, wrapGlobWithTimeout } from '../../utils/glob';

const requiredPackages = [
  // use typescript/package.json to skip node module cache issues when the user installs
  // the package and attempts to resolve the module in the same process.
  { file: 'typescript/package.json', pkg: 'typescript' },
  { file: '@types/react/index.d.ts', pkg: '@types/react' },
  { file: '@types/react-native/index.d.ts', pkg: '@types/react-native' },
];

export const baseTSConfigName = 'expo/tsconfig.base';

export async function queryFirstProjectTypeScriptFileAsync(
  projectRoot: string
): Promise<null | string> {
  const results = await wrapGlobWithTimeout(
    () =>
      everyMatchAsync('**/*.@(ts|tsx)', {
        cwd: projectRoot,
        ignore: [
          '**/@(Carthage|Pods|node_modules)/**',
          '**/*.d.ts',
          '@(ios|android|web|web-build|dist)/**',
        ],
      }),
    5000
  );

  if (results === false) {
    return null;
  }
  return results[0] ?? null;
}

export function resolveBaseTSConfig(projectRoot: string): string | null {
  return resolveFrom.silent(projectRoot, 'expo/tsconfig.base.json') ?? null;
}

export async function hasTSConfig(projectRoot: string): Promise<string | null> {
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  if (await fileExistsAsync(tsConfigPath)) {
    return tsConfigPath;
  }
  return null;
}

export function collectMissingPackages(projectRoot: string): {
  missing: {
    file: string;
    pkg: string;
    version?: string;
  }[];
  resolutions: Record<string, string>;
} {
  const resolutions: Record<string, string> = {};

  const missingPackages = requiredPackages.filter((p) => {
    try {
      resolutions[p.pkg] = resolveFrom(projectRoot, p.file);
      return false;
    } catch {
      return true;
    }
  });

  return { missing: missingPackages, resolutions };
}
