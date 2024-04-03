import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';

import { ESLintProjectPrerequisite } from './ESlintPrerequisite';
import { Log } from '../log';
import { isInteractive } from '../utils/interactive';

export const lintAsync = async (projectRoot: string) => {
  const prerequisite = new ESLintProjectPrerequisite(projectRoot);

  const hasESLintConfigured = await prerequisite.assertImplementation();

  if (!hasESLintConfigured) {
    const configured = await prerequisite.bootstrapAsync();

    if (!configured && !isInteractive()) {
      Log.log('No ESLint setup found. Skipping linting.');
    }
  }

  const packageManager = PackageManager.resolvePackageManager(projectRoot) || 'npm';

  // TODO(Kadi): check if there's a lint command first?
  await spawnAsync(packageManager, ['run', 'lint'], {
    stdio: 'inherit',
    cwd: projectRoot,
  });
};
