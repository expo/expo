import spawn from 'cross-spawn';

/**
 * Finds user's name by reading it from the git config.
 */
export async function findMyName(): Promise<string> {
  try {
    return spawn.sync('git', ['config', '--get', 'user.name']).stdout.toString().trim();
  } catch {
    return '';
  }
}

/**
 * Finds user's email by reading it from the git config.
 */
export async function findGitHubEmail(): Promise<string> {
  try {
    return spawn.sync('git', ['config', '--get', 'user.email']).stdout.toString().trim();
  } catch {
    return '';
  }
}
