import { vol } from 'memfs';

import { DependencyVersionOverrideCheck } from '../DependencyVersionOverrideCheck';

jest.mock('fs');

const mockResolveFromSilent = jest.fn();
jest.mock('resolve-from', () => ({
  __esModule: true,
  default: { silent: (...args: any[]) => mockResolveFromSilent(...args) },
}));

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '53.0.0',
  },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

/**
 * Sets up memfs and mocks resolveFrom.silent to simulate Node resolution.
 *
 * @param packages - flat map of package name to package.json content.
 *   By default all packages are placed at <projectRoot>/node_modules/<name>.
 * @param resolutionGraph - maps "baseDir > packageName" to the directory that
 *   contains the package. When provided, only explicitly listed resolutions work.
 *   When omitted, all packages resolve from any base directory (flat hoisted layout).
 */
function setupNodeModules(
  packages: Record<string, { version: string; dependencies?: Record<string, string> }>,
  resolutionGraph?: Record<string, string>
) {
  const files: Record<string, string> = {};
  const packageDirs: Record<string, string> = {};

  for (const [name, content] of Object.entries(packages)) {
    const dir = `${projectRoot}/node_modules/${name}`;
    files[`${dir}/package.json`] = JSON.stringify(content);
    packageDirs[name] = dir;
  }

  vol.fromJSON(files);

  mockResolveFromSilent.mockImplementation((baseDir: string, moduleId: string) => {
    const match = moduleId.match(/^(.+)\/package\.json$/);
    if (!match) {
      return undefined;
    }
    const packageName = match[1];

    if (resolutionGraph) {
      const key = `${baseDir} > ${packageName}`;
      const resolvedDir = resolutionGraph[key];
      if (resolvedDir) {
        const filePath = `${resolvedDir}/package.json`;
        if (vol.existsSync(filePath)) {
          return filePath;
        }
      }
      return undefined;
    }

    // Default: resolve all packages from anywhere (flat hoisted layout)
    const dir = packageDirs[packageName];
    if (dir && vol.existsSync(`${dir}/package.json`)) {
      return `${dir}/package.json`;
    }
    return undefined;
  });
}

describe('runAsync', () => {
  afterEach(() => {
    vol.reset();
    jest.restoreAllMocks();
  });

  it('returns result with isSuccessful = true when dependency versions satisfy expected ranges', async () => {
    setupNodeModules({
      expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      '@expo/cli': { version: '0.20.5' },
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('returns result with isSuccessful = false when an installed version does not satisfy the expected range', async () => {
    setupNodeModules({
      expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      '@expo/cli': { version: '0.18.0' },
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]).toContain('@expo/cli');
    expect(result.issues[1]).toContain('0.18.0');
  });

  it('adds advice to remove resolutions when dependency is in resolutions', async () => {
    setupNodeModules({
      expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      '@expo/cli': { version: '0.18.0' },
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', resolutions: { '@expo/cli': '0.18.0' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice.some((a) => a.includes('Remove the resolution/override'))).toBeTruthy();
    expect(result.advice.some((a) => a.includes('@expo/cli'))).toBeTruthy();
  });

  it('adds advice to remove overrides when dependency is in npm overrides', async () => {
    setupNodeModules({
      expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      '@expo/cli': { version: '0.18.0' },
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', overrides: { '@expo/cli': '0.18.0' } },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice.some((a) => a.includes('Remove the resolution/override'))).toBeTruthy();
  });

  it('adds advice to remove overrides when dependency is in pnpm overrides', async () => {
    setupNodeModules({
      expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      '@expo/cli': { version: '0.18.0' },
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'test',
        version: '1.0.0',
        pnpm: { overrides: { '@expo/cli': '0.18.0' } },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice.some((a) => a.includes('Remove the resolution/override'))).toBeTruthy();
  });

  it('skips check when root package in chain cannot be resolved', async () => {
    setupNodeModules(
      {
        '@expo/cli': { version: '0.18.0' },
      },
      {
        // expo is not resolvable from project root
        [`${projectRoot} > @expo/cli`]: `${projectRoot}/node_modules/@expo/cli`,
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('skips check when the target dependency cannot be resolved from parent', async () => {
    const expoDir = `${projectRoot}/node_modules/expo`;

    setupNodeModules(
      {
        expo: { version: '53.0.0', dependencies: { '@expo/cli': '^0.20.0' } },
      },
      {
        [`${projectRoot} > expo`]: expoDir,
        // @expo/cli is not resolvable from expo's dir
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('traverses multi-step chains resolving each package from its parent', async () => {
    const expoDir = `${projectRoot}/node_modules/expo`;
    const metroWrapperDir = `${projectRoot}/node_modules/@expo/metro`;

    setupNodeModules(
      {
        expo: { version: '53.0.0', dependencies: { '@expo/metro': '^1.0.0' } },
        '@expo/metro': {
          version: '1.0.0',
          dependencies: { metro: '^0.81.0', 'metro-resolver': '^0.81.0' },
        },
        metro: { version: '0.76.0' },
        'metro-resolver': { version: '0.76.0' },
      },
      {
        [`${projectRoot} > expo`]: expoDir,
        [`${expoDir} > @expo/metro`]: metroWrapperDir,
        [`${metroWrapperDir} > metro`]: `${projectRoot}/node_modules/metro`,
        [`${metroWrapperDir} > metro-resolver`]: `${projectRoot}/node_modules/metro-resolver`,
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(3);
    expect(result.issues[1]).toContain('@expo/metro');
    expect(result.issues[1]).toContain('metro');
    expect(result.issues[2]).toContain('metro-resolver');
  });

  it('skips chain when an optional package cannot be resolved (e.g. expo-router not installed)', async () => {
    setupNodeModules(
      {
        '@expo/metro-runtime': { version: '1.0.0' },
      },
      {
        // expo-router cannot be resolved from project root (not installed)
        [`${projectRoot} > @expo/metro-runtime`]: `${projectRoot}/node_modules/@expo/metro-runtime`,
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('skips chain when intermediate package does not declare next package as dependency', async () => {
    const expoDir = `${projectRoot}/node_modules/expo`;

    setupNodeModules(
      {
        expo: { version: '53.0.0', dependencies: {} },
        '@expo/metro': { version: '1.0.0', dependencies: { metro: '^0.81.0' } },
        metro: { version: '0.76.0' },
      },
      {
        [`${projectRoot} > expo`]: expoDir,
        [`${expoDir} > @expo/metro`]: `${projectRoot}/node_modules/@expo/metro`,
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('checks the expo-router chain when expo-router is installed', async () => {
    const routerDir = `${projectRoot}/node_modules/expo-router`;

    setupNodeModules(
      {
        'expo-router': {
          version: '5.0.0',
          dependencies: { '@expo/metro-runtime': '^5.0.0' },
        },
        '@expo/metro-runtime': { version: '4.0.0' },
      },
      {
        [`${projectRoot} > expo-router`]: routerDir,
        [`${routerDir} > @expo/metro-runtime`]: `${projectRoot}/node_modules/@expo/metro-runtime`,
      }
    );

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]).toContain('expo-router');
    expect(result.issues[1]).toContain('@expo/metro-runtime');
  });

  it('resolves packages from isolated node_modules (pnpm-style)', async () => {
    const expoDir = `${projectRoot}/node_modules/.pnpm/expo@53.0.0/node_modules/expo`;
    const metroWrapperDir = `${projectRoot}/node_modules/.pnpm/@expo+metro@1.0.0/node_modules/@expo/metro`;
    const metroDir = `${projectRoot}/node_modules/.pnpm/metro@0.76.0/node_modules/metro`;

    const files: Record<string, string> = {};
    files[`${expoDir}/package.json`] = JSON.stringify({
      version: '53.0.0',
      dependencies: { '@expo/metro': '^1.0.0' },
    });
    files[`${metroWrapperDir}/package.json`] = JSON.stringify({
      version: '1.0.0',
      dependencies: { metro: '^0.81.0' },
    });
    files[`${metroDir}/package.json`] = JSON.stringify({ version: '0.76.0' });

    vol.fromJSON(files);

    mockResolveFromSilent.mockImplementation((baseDir: string, moduleId: string) => {
      const match = moduleId.match(/^(.+)\/package\.json$/);
      if (!match) {
        return undefined;
      }
      const packageName = match[1];

      const graph: Record<string, string | undefined> = {
        [`${projectRoot} > expo`]: expoDir,
        [`${expoDir} > @expo/metro`]: metroWrapperDir,
        [`${metroWrapperDir} > metro`]: metroDir,
        // metro is NOT resolvable from the project root
      };

      const resolved = graph[`${baseDir} > ${packageName}`];
      return resolved ? `${resolved}/package.json` : undefined;
    });

    const check = new DependencyVersionOverrideCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]).toContain('metro');
    expect(result.issues[1]).toContain('0.76.0');
  });
});
