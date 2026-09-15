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
 * The options must match the reader's (`src/project/fingerprint.ts` in expo/expo-agent-cli).
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
  // No platform means the caller is not managing fingerprints — `@expo/cli`'s rebundle path asks
  // for the app config alone — and clearing the file would strip it out of an app already built.
  if (platform === undefined) {
    return null;
  }

  // Cleared before the opt-out tests, not after: the iOS destination directory persists across
  // builds, so a release build or an opted-out one has to remove what a debug build left.
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
  console.warn(
    `Could not embed the project fingerprint (app.fingerprint): ${error.message}. ` +
      `The build continues normally, but \`npx @expo/agent-cli status --explain\` cannot tell whether this build matches the project until a build with an embedded fingerprint succeeds.`
  );
}

module.exports = {
  createFingerprintFileAsync,
  FINGERPRINT_FILE_NAME,
};

// Direct invocation from the Android build, whose task only exists for debuggable variants — hence
// the hardcoded `enabled`.
if (require.main === module) {
  (async () => {
    const projectRoot = resolveProjectRoot(process.argv[2] ?? process.cwd());
    await createFingerprintFileAsync(projectRoot, process.argv[3], process.argv[4], true);
  })();
}
