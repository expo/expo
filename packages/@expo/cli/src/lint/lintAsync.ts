import { createForProject } from '@expo/package-manager';

import { ESLintProjectPrerequisite } from './ESlintPrerequisite';

export const lintAsync = async (projectRoot: string) => {
  const prerequisite = new ESLintProjectPrerequisite(projectRoot);
  if (!(await prerequisite.assertAsync())) {
    await prerequisite.bootstrapAsync();
  }

  const manager = createForProject(projectRoot);
  try {
    await manager.runBinAsync(['eslint', '.']);
  } catch (error: any) {
    process.exit(error.status);
  }
};
