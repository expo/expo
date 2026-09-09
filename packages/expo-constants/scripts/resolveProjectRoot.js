// @ts-check
/// <reference types="node" />

const fs = require('node:fs');
const path = require('node:path');

// TODO: Verify we can remove projectRoot validation, now that we no longer
// support React Native <= 62
/**
 * Resolve the app root from the app directory or from its native project directory. Gradle passes
 * `rootProject.projectDir`, which is `<project>/android`, and both scripts must be anchored at
 * `<project>`.
 *
 * @param {string} possibleProjectRoot
 * @returns {string}
 */
function resolveProjectRoot(possibleProjectRoot) {
  const resolvedProjectRoot = path.resolve(possibleProjectRoot);
  if (fs.existsSync(path.join(resolvedProjectRoot, 'package.json'))) {
    return resolvedProjectRoot;
  }

  const parentProjectRoot = path.dirname(resolvedProjectRoot);
  if (fs.existsSync(path.join(parentProjectRoot, 'package.json'))) {
    return parentProjectRoot;
  }

  throw new Error(
    `Unable to locate project (no package.json found) at path: ${possibleProjectRoot}`
  );
}

module.exports = { resolveProjectRoot };
