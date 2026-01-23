import { vol } from 'memfs';
import { resolveWorkspaceRoot } from 'resolve-workspace-root';

import { TrustedDependencyCheck } from '../TrustedDependencyCheck';

jest.mock('fs');
jest.mock('resolve-workspace-root', () => ({
  resolveWorkspaceRoot: jest.fn(() => null),
}));

const projectRoot = '/tmp/project';

const additionalProjectProps = {
  exp: { name: 'name', slug: 'slug', sdkVersion: '55.0.0' },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

const skiaPackage = { dependencies: { '@shopify/react-native-skia': '^2.0.0' } };

describe('TrustedDependencyCheck', () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('passes when skia is not installed', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(true);
  });

  it('passes when using yarn (no trustedDependencies needed)', async () => {
    vol.fromJSON({ [projectRoot + '/yarn.lock']: 'test' });
    const check = new TrustedDependencyCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...skiaPackage },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(true);
  });

  it('passes on SDK 54 (before SDK 55 requirement)', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...skiaPackage },
      ...additionalProjectProps,
      exp: { name: 'name', slug: 'slug', sdkVersion: '54.0.0' },
    });
    expect(result.isSuccessful).toBe(true);
  });

  describe('bun', () => {
    it('fails and provides bun pm trust advice', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      const result = await check.runAsync({
        pkg: { name: 'test', version: '1.0.0', ...skiaPackage },
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(false);
      expect(result.advice[0]).toMatchSnapshot();
      expect(result.advice[0]).toContain('bun pm trust');
    });

    it('passes when trustedDependencies includes skia', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          ...skiaPackage,
          trustedDependencies: ['@shopify/react-native-skia'],
        } as any,
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(true);
    });
  });

  describe('pnpm', () => {
    it('fails and provides correct advice', async () => {
      vol.fromJSON({ [projectRoot + '/pnpm-lock.yaml']: 'test' });
      const check = new TrustedDependencyCheck();
      const result = await check.runAsync({
        pkg: { name: 'test', version: '1.0.0', ...skiaPackage },
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(false);
      expect(result.advice[0]).toMatchSnapshot();
    });

    it('passes when pnpm.onlyBuiltDependencies includes skia', async () => {
      vol.fromJSON({ [projectRoot + '/pnpm-lock.yaml']: 'test' });
      const check = new TrustedDependencyCheck();
      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          ...skiaPackage,
          pnpm: { onlyBuiltDependencies: ['@shopify/react-native-skia'] },
        } as any,
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(true);
    });
  });

  it('checks devDependencies too', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', devDependencies: skiaPackage.dependencies },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(false);
  });

  it('checks lockfile at monorepo root', async () => {
    const monorepoRoot = '/monorepo-root';
    vol.fromJSON({ [monorepoRoot + '/bun.lockb']: 'test' });
    jest.mocked(resolveWorkspaceRoot).mockReturnValue(monorepoRoot);

    const check = new TrustedDependencyCheck();
    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...skiaPackage },
      ...additionalProjectProps,
      projectRoot: '/monorepo-root/apps/my-app',
    });
    expect(result.isSuccessful).toBe(false);
  });

  describe('multiple packages', () => {
    const multipleCheckItems = [
      {
        packageName: '@shopify/react-native-skia',
        getMessage: (name: string) => `Package "${name}" requires postinstall.`,
        sdkVersionRange: '>=55.0.0',
      },
      {
        packageName: 'some-other-package',
        getMessage: (name: string) => `Package "${name}" requires postinstall.`,
        sdkVersionRange: '>=55.0.0',
      },
    ];

    it('reports multiple missing packages for bun', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = multipleCheckItems;

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          dependencies: {
            '@shopify/react-native-skia': '^2.0.0',
            'some-other-package': '^1.0.0',
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0]).toContain('@shopify/react-native-skia');
      expect(result.issues[1]).toContain('some-other-package');
      expect(result.advice[0]).toContain('bun pm trust @shopify/react-native-skia some-other-package');
    });

    it('reports multiple missing packages for pnpm', async () => {
      vol.fromJSON({ [projectRoot + '/pnpm-lock.yaml']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = multipleCheckItems;

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          dependencies: {
            '@shopify/react-native-skia': '^2.0.0',
            'some-other-package': '^1.0.0',
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.advice[0]).toContain('@shopify/react-native-skia');
      expect(result.advice[0]).toContain('some-other-package');
    });

    it('only reports packages that are missing from trustedDependencies', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = multipleCheckItems;

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          dependencies: {
            '@shopify/react-native-skia': '^2.0.0',
            'some-other-package': '^1.0.0',
          },
          trustedDependencies: ['@shopify/react-native-skia'],
        } as any,
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('some-other-package');
      expect(result.issues[0]).not.toContain('@shopify/react-native-skia');
    });

    it('passes when all packages are in trustedDependencies', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = multipleCheckItems;

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          dependencies: {
            '@shopify/react-native-skia': '^2.0.0',
            'some-other-package': '^1.0.0',
          },
          trustedDependencies: ['@shopify/react-native-skia', 'some-other-package'],
        } as any,
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(true);
    });

    it('only checks packages that are installed', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = multipleCheckItems;

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          dependencies: {
            '@shopify/react-native-skia': '^2.0.0',
            // some-other-package is NOT installed
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('@shopify/react-native-skia');
    });
  });
});
