// @ts-check
/// <reference types="node" />

const { resolveFrom } = require('@expo/require-utils');
const fs = require('node:fs');
const path = require('node:path');

const { resolveProjectRoot } = require('./resolveProjectRoot');

const FINGERPRINT_FILE_NAME = 'app.fingerprint';

/**
 * Compute the project fingerprint and write it to `app.fingerprint`, next to `app.config`.
 *
 * Any previously embedded fingerprint is removed first: the iOS destination directory persists
 * across builds, so a stale hash must never describe a newer binary.
 *
 * The options here must match the ones the reader passes (`src/project/fingerprint.ts` in
 * expo/expo-agent-cli), or the two hashes never agree.
 *
 * @param {string} projectRoot
 * @param {string} destinationDir
 * @param {string | undefined} platform
 * @param {boolean} enabled false for non-debug builds; the stale file is still removed
 * @returns {Promise<string | null>} path of the written file, or null when skipped
 */
async function createFingerprintFileAsync(projectRoot, destinationDir, platform, enabled) {
  const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
  await fs.promises.rm(filePath, { force: true });

  if (!enabled) {
    return null;
  }
  if (isFingerprintEmbeddingDisabled()) {
    return null;
  }
  if (platform !== 'ios' && platform !== 'android') {
    return null;
  }

  // From the project root, like the reader: a module-relative require could load another copy in a
  // hoisted monorepo and embed a hash nothing can reproduce.
  const fingerprintPath = resolveFrom(projectRoot, 'expo/fingerprint');
  if (!fingerprintPath) {
    return null;
  }
  const Fingerprint = require(fingerprintPath);

  const hash = await Fingerprint.createProjectHashAsync(projectRoot, {
    platforms: [platform],
    silent: true,
  });
  if (!hash) {
    return null;
  }

  await fs.promises.writeFile(filePath, hash);
  return filePath;
}

function isFingerprintEmbeddingDisabled() {
  const value = process.env.EXPO_SKIP_FINGERPRINT_EMBED;
  return value != null && !['0', 'false', ''].includes(value.toLowerCase());
}

/**
 * @param {Error} error
 */
function warnFingerprintEmbedFailed(error) {
  // The fingerprint is optional metadata: never fail the build over it.
  console.warn(
    `Could not embed the project fingerprint (app.fingerprint): ${error.message}. ` +
      `The build continues normally, but \`npx @expo/agent-cli status --explain\` cannot tell whether this build matches the project until a build with an embedded fingerprint succeeds.`
  );
}

module.exports = {
  createFingerprintFileAsync,
  warnFingerprintEmbedFailed,
  FINGERPRINT_FILE_NAME,
};

// Direct invocation from the Android build. The gradle script registers the task for debuggable
// variants only, so `enabled` is always true here. `@expo/fingerprint` loads the app config in a
// child process with its own environment, so nothing has to be set up here first.
if (require.main === module) {
  const projectRoot = resolveProjectRoot(process.argv[2] ?? process.cwd());
  createFingerprintFileAsync(projectRoot, process.argv[3], process.argv[4], true).catch(
    warnFingerprintEmbedFailed
  );
}
