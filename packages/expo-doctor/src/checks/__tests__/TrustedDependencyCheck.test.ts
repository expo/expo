import { vol } from 'memfs';
import { resolveWorkspaceRoot } from 'resolve-workspace-root';

import { TrustedDependencyCheck, TrustedDependencyCheckItem } from '../TrustedDependencyCheck';

jest.mock('fs');
jest.mock('resolve-workspace-root', () => ({
  resolveWorkspaceRoot: jest.fn(() => null),
}));

const projectRoot = '/tmp/project';

const additionalProjectProps = {
  exp: { name: 'name', slug: 'slug', sdkVersion: '50.0.0' },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

// Mock check item used by all tests - independent of actual trustedDependencyCheckItems
const mockCheckItem: TrustedDependencyCheckItem = {
  packageName: 'test-package-with-postinstall',
  getMessage: (name: string) => `Package "${name}" requires a postinstall script.`,
  sdkVersionRange: '>=50.0.0',
};

const mockPackageDep = { dependencies: { 'test-package-with-postinstall': '^1.0.0' } };

describe('TrustedDependencyCheck', () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('passes when checked package is not installed', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    check.checkItems = [mockCheckItem];

    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(true);
  });

  it('passes when using yarn (no trustedDependencies needed)', async () => {
    vol.fromJSON({ [projectRoot + '/yarn.lock']: 'test' });
    const check = new TrustedDependencyCheck();
    check.checkItems = [mockCheckItem];

    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...mockPackageDep },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(true);
  });

  it('passes when SDK version is outside check item range', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    check.checkItems = [mockCheckItem];

    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...mockPackageDep },
      ...additionalProjectProps,
      exp: { name: 'name', slug: 'slug', sdkVersion: '49.0.0' },
    });
    expect(result.isSuccessful).toBe(true);
  });

  describe('bun', () => {
    it('fails and provides bun pm trust advice', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = [mockCheckItem];

      const result = await check.runAsync({
        pkg: { name: 'test', version: '1.0.0', ...mockPackageDep },
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(false);
      expect(result.advice[0]).toMatchSnapshot();
      expect(result.advice[0]).toContain('bun pm trust');
    });

    it('passes when trustedDependencies includes the package', async () => {
      vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = [mockCheckItem];

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          ...mockPackageDep,
          trustedDependencies: ['test-package-with-postinstall'],
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
      check.checkItems = [mockCheckItem];

      const result = await check.runAsync({
        pkg: { name: 'test', version: '1.0.0', ...mockPackageDep },
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(false);
      expect(result.advice[0]).toMatchSnapshot();
    });

    it('passes when pnpm.onlyBuiltDependencies includes the package', async () => {
      vol.fromJSON({ [projectRoot + '/pnpm-lock.yaml']: 'test' });
      const check = new TrustedDependencyCheck();
      check.checkItems = [mockCheckItem];

      const result = await check.runAsync({
        pkg: {
          name: 'test',
          version: '1.0.0',
          ...mockPackageDep,
          pnpm: { onlyBuiltDependencies: ['test-package-with-postinstall'] },
        } as any,
        ...additionalProjectProps,
      });
      expect(result.isSuccessful).toBe(true);
    });
  });

  it('checks devDependencies too', async () => {
    vol.fromJSON({ [projectRoot + '/bun.lockb']: 'test' });
    const check = new TrustedDependencyCheck();
    check.checkItems = [mockCheckItem];

    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', devDependencies: mockPackageDep.dependencies },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBe(false);
  });

  it('checks lockfile at monorepo root', async () => {
    const monorepoRoot = '/monorepo-root';
    vol.fromJSON({ [monorepoRoot + '/bun.lockb']: 'test' });
    jest.mocked(resolveWorkspaceRoot).mockReturnValue(monorepoRoot);

    const check = new TrustedDependencyCheck();
    check.checkItems = [mockCheckItem];

    const result = await check.runAsync({
      pkg: { name: 'test', version: '1.0.0', ...mockPackageDep },
      ...additionalProjectProps,
      projectRoot: '/monorepo-root/apps/my-app',
    });
    expect(result.isSuccessful).toBe(false);
  });

  describe('multiple packages', () => {
    const multipleCheckItems: TrustedDependencyCheckItem[] = [
      {
        packageName: 'first-package',
        getMessage: (name: string) => `Package "${name}" requires postinstall.`,
        sdkVersionRange: '>=50.0.0',
      },
      {
        packageName: 'second-package',
        getMessage: (name: string) => `Package "${name}" requires postinstall.`,
        sdkVersionRange: '>=50.0.0',
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
            'first-package': '^1.0.0',
            'second-package': '^1.0.0',
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0]).toContain('first-package');
      expect(result.issues[1]).toContain('second-package');
      expect(result.advice[0]).toContain('bun pm trust first-package second-package');
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
            'first-package': '^1.0.0',
            'second-package': '^1.0.0',
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.advice[0]).toContain('first-package');
      expect(result.advice[0]).toContain('second-package');
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
            'first-package': '^1.0.0',
            'second-package': '^1.0.0',
          },
          trustedDependencies: ['first-package'],
        } as any,
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('second-package');
      expect(result.issues[0]).not.toContain('first-package');
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
            'first-package': '^1.0.0',
            'second-package': '^1.0.0',
          },
          trustedDependencies: ['first-package', 'second-package'],
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
            'first-package': '^1.0.0',
            // second-package is NOT installed
          },
        },
        ...additionalProjectProps,
      });

      expect(result.isSuccessful).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('first-package');
    });
  });
});
