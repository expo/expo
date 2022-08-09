import { execSync } from 'child_process';

import { isUsingNpm } from './nodeWorkspaces';

export default function shouldUseYarn(): boolean {
  if (process.env.npm_config_user_agent?.startsWith('yarn')) {
    return true;
  }

  if (isUsingNpm(process.cwd())) {
    return false;
  }

  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
