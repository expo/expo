import chalk from 'chalk';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import githubUsername from 'github-username';
import ora from 'ora';
import path from 'path';
export type StepOptions = ora.Options;

export async function newStep<Result>(
  title: string,
  action: (step: ora.Ora) => Promise<Result> | Result,
  options: StepOptions = {}
): Promise<Result> {
  const disabled = process.env.CI || process.env.EXPO_DEBUG;
  const step = ora({
    text: chalk.bold(title),
    isEnabled: !disabled,
    stream: disabled ? process.stdout : process.stderr,
    ...options,
  });

  step.start();

  try {
    return await action(step);
  } catch (error) {
    step.fail();
    console.error(error);
    process.exit(1);
  }
}

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

/**
 * Get the GitHub username from an email address if the email can be found in any commits on GitHub.
 */
export async function findGitHubProfileUrl(email: string): Promise<string> {
  try {
    const username = (await githubUsername(email)) ?? '';
    return `https://github.com/${username}`;
  } catch {
    return '';
  }
}

/**
 * Guesses the repository URL based on the author profile URL and the package slug.
 */
export async function guessRepoUrl(authorUrl: string, slug: string) {
  if (/^https?:\/\/github.com\/[^/]+/.test(authorUrl)) {
    const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
    return `${authorUrl}/${normalizedSlug}`;
  }
  return '';
}

export function findPackageJson(startDir) {
  let dir = path.resolve(startDir || process.cwd());

  do {
    const pkgfile = path.join(dir, 'package.json');

    if (!fs.existsSync(pkgfile)) {
      dir = path.join(dir, '..');
      continue;
    }
    return pkgfile;
  } while (dir !== path.resolve(dir, '..'));
  return null;
}
