import { resolvePackageManager } from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';

import { ESLintProjectPrerequisite } from './ESlintPrerequisite';

export const lintAsync = async (projectRoot: string) => {
  await new ESLintProjectPrerequisite(projectRoot).assertAsync();

  const manager = resolvePackageManager(projectRoot) || 'npm';

  try {
    await spawnAsync(manager === 'npm' ? 'npx' : manager, ['eslint', '.'], {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
        ESLINT_USE_FLAT_CONFIG: 'false',
      },
    });
  } catch (error: any) {
    process.exit(error.status);
  }
};
