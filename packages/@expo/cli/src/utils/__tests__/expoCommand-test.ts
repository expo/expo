import { resolvePackageManager } from '@expo/package-manager';

import { formatExpoCommand, resolvePackageManagerForHints } from '../expoCommand';

describe(formatExpoCommand, () => {
  it.each([
    ['npm', 'npx expo start'],
    ['yarn', 'yarn expo start'],
    ['pnpm', 'pnpm expo start'],
    ['bun', 'bun expo start'],
    ['nub', 'nub expo start'],
  ] as const)('formats the command for %s', (packageManager, expected) => {
    expect(formatExpoCommand(packageManager, 'start')).toBe(expected);
  });
});

describe(resolvePackageManagerForHints, () => {
  it.each(['npm', 'yarn', 'pnpm', 'bun', 'nub'] as const)(
    'uses %s when resolved from the lockfile',
    (packageManager) => {
      jest.mocked(resolvePackageManager).mockReturnValue(packageManager);
      expect(resolvePackageManagerForHints('/project')).toBe(packageManager);
      expect(resolvePackageManager).toHaveBeenCalledWith('/project');
    }
  );

  it('falls back to npm without a lockfile', () => {
    jest.mocked(resolvePackageManager).mockReturnValue(null);
    expect(resolvePackageManagerForHints('/project')).toBe('npm');
  });
});
