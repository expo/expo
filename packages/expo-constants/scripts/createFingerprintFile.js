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

  // From the project root: a module-relative require could load another copy in a hoisted monorepo.
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

  // JSON rather than a bare hash so the reader can tell which `@expo/fingerprint` produced it.
  // Reason tags and hashing change between versions, so two hashes from different ones are not
  // comparable, and a reader that assumes they are reports a rebuild that is not needed.
  const contents = { hash, fingerprintVersion: readFingerprintVersion(fingerprintPath) };
  await fs.promises.writeFile(filePath, JSON.stringify(contents));
  return filePath;
}

/**
 * Version of the `@expo/fingerprint` that computed the hash, or null when it cannot be read.
 *
 * @param {string} fingerprintPath resolved path of the `expo/fingerprint` module
 * @returns {string | null}
 */
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

// Direct invocation from the Android build. The gradle task is registered for debuggable variants
// only, so `enabled` is always true here.
if (require.main === module) {
  const projectRoot = resolveProjectRoot(process.argv[2] ?? process.cwd());
  createFingerprintFileAsync(projectRoot, process.argv[3], process.argv[4], true).catch(
    warnFingerprintEmbedFailed
  );
}
