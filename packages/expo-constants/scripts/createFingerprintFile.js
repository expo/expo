// @ts-check
/// <reference types="node" />

const { resolveFrom } = require('@expo/require-utils');
const fs = require('node:fs');
const path = require('node:path');

const { resolveProjectRoot } = require('./resolveProjectRoot');

const FINGERPRINT_FILE_NAME = 'app.fingerprint';

/**
 * Write the project fingerprint to `app.fingerprint`, next to `app.config`.
 *
 * Deletes any previous one first: the iOS destination directory persists across builds. The
 * options must match the reader's (`src/project/fingerprint.ts` in expo/expo-agent-cli).
 *
 * Never rejects: the fingerprint is optional metadata, so a failure is warned and the build goes on.
 *
 * @param {string} projectRoot
 * @param {string} destinationDir
 * @param {string | undefined} platform
 * @param {boolean} enabled false for non-debug builds; the stale file is still removed
 * @returns {Promise<string | null>} path of the written file, or null when skipped or failed
 */
async function createFingerprintFileAsync(projectRoot, destinationDir, platform, enabled) {
  try {
    return await writeFingerprintFileAsync(projectRoot, destinationDir, platform, enabled);
  } catch (error) {
    warnFingerprintEmbedFailed(/** @type {Error} */ (error));
    return null;
  }
}

/** @type {typeof createFingerprintFileAsync} */
async function writeFingerprintFileAsync(projectRoot, destinationDir, platform, enabled) {
  const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
  await fs.promises.rm(filePath, { force: true });

  const skip =
    !enabled || isFingerprintEmbeddingDisabled() || (platform !== 'ios' && platform !== 'android');
  if (skip) {
    return null;
  }

  // From the project root: a module-relative require could load another copy in a hoisted monorepo.
  const fingerprintPath = resolveFrom(projectRoot, 'expo/fingerprint');
  if (!fingerprintPath) {
    return null;
  }
  const Fingerprint = require(fingerprintPath);

  // The whole fingerprint, not just the hash: with the sources embedded, two fingerprints can be
  // diffed to name the input that changed instead of only reporting that they differ.
  const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot, {
    platforms: [platform],
    silent: true,
  });
  if (!fingerprint?.hash) {
    return null;
  }

  const contents = { ...fingerprint, fingerprintVersion: readFingerprintVersion(fingerprintPath) };
  await fs.promises.writeFile(filePath, JSON.stringify(contents));
  return filePath;
}

/** @param {string} fingerprintPath */
function readFingerprintVersion(fingerprintPath) {
  const packagePath = resolveFrom(path.dirname(fingerprintPath), '@expo/fingerprint/package.json');
  if (!packagePath) {
    return null;
  }
  try {
    return require(packagePath).version ?? null;
  } catch {
    return null;
  }
}

function isFingerprintEmbeddingDisabled() {
  const value = process.env.EXPO_SKIP_FINGERPRINT_EMBED;
  return value != null && !['0', 'false', ''].includes(value.toLowerCase());
}

/** @param {Error} error */
function warnFingerprintEmbedFailed(error) {
  // The fingerprint is optional metadata: never fail the build over it.
  console.warn(
    `Could not embed the project fingerprint (app.fingerprint): ${error.message}. ` +
      `The build continues normally, but \`npx @expo/agent-cli status --explain\` cannot tell whether this build matches the project until a build with an embedded fingerprint succeeds.`
  );
}

module.exports = {
  createFingerprintFileAsync,
  FINGERPRINT_FILE_NAME,
};

// Direct invocation from the Android build. The gradle task is registered for debuggable variants
// only, so `enabled` is always true here.
if (require.main === module) {
  (async () => {
    const projectRoot = resolveProjectRoot(process.argv[2] ?? process.cwd());
    await createFingerprintFileAsync(projectRoot, process.argv[3], process.argv[4], true);
  })();
}
