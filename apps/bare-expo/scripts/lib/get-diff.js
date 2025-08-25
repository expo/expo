// @ts-check
const { execSync } = require('child_process');

/**
 * Get modified packages from git diff
 * @param {string} projectRoot
 * @returns {string[]}
 */
function getDiff(projectRoot) {
  let diffCommand;

  if (process.env.CI) {
    // In a PR, compare against the base branch
    const baseRef = process.env.GITHUB_BASE_REF;
    diffCommand = `git diff --name-only origin/${baseRef}...HEAD`;
  } else {
    // For local development, compare against the main branch
    diffCommand = `git diff --name-only origin/main...HEAD`;
  }

  try {
    // Try the primary diff command
    const diffOutput = execSync(diffCommand, {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    return diffOutput.trim().split('\n').filter(Boolean);
  } catch (diffError) {
    console.warn(`diff command failed: ${diffError.message}`);
    // runs all tests
    throw diffError;
  }
}

module.exports = {
  getDiff,
};
