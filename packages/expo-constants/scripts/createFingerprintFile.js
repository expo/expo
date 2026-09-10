// @ts-check
/// <reference types="node" />

const fs = require('node:fs');
const path = require('node:path');

const FINGERPRINT_FILE_NAME = 'app.fingerprint';

// TODO: Verify we can remove projectRoot validation, now that we no longer
// support React Native <= 62
/**
 * Resolve the app root from the app directory or from its native project directory. Gradle
 * passes `<project>/android`, and fingerprinting must be anchored at `<project>`.
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

/**
 * Compute the project fingerprint and write it to `app.fingerprint`, next to `app.config`.
 *
 * Any previously embedded fingerprint is removed first: the iOS destination directory persists
 * across builds, so a stale hash must never describe a newer binary.
 *
 * The options here must match `nativeFingerprintOptions` in
 * `@expo/cli/src/utils/nativeFingerprint.ts`, or the two hashes never agree.
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

  let Fingerprint;
  try {
    // From the project root, like the check side: a module-relative require could load another
    // copy in a hoisted monorepo and embed a hash nothing can reproduce.
    Fingerprint = require(require.resolve('expo/fingerprint', { paths: [projectRoot] }));
  } catch {
    return null;
  }

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
      `The build continues normally, but \`npx @expo/agent-cli needs-rebuild\` cannot verify this build until a build with an embedded fingerprint succeeds.`
  );
}

module.exports = {
  createFingerprintFileAsync,
  resolveProjectRoot,
  warnFingerprintEmbedFailed,
  FINGERPRINT_FILE_NAME,
};

// Direct invocation from the Android build. The gradle script registers the task for debuggable
// variants only, so `enabled` is always true here.
if (require.main === module) {
  const possibleProjectRoot = process.argv[2] ?? process.cwd();
  const destinationDir = process.argv[3];
  const platform = process.argv[4];
  Promise.resolve()
    .then(() => {
      const projectRoot = resolveProjectRoot(possibleProjectRoot);
      // Development mode, like the check side. A build launched from the IDE has no NODE_ENV,
      // which would skip the `.env.development` files the check side loads.
      process.env.NODE_ENV =
        process.env.EXPO_CONFIG_MODE === 'production' ? 'production' : 'development';
      require('@expo/env').load(projectRoot);
      process.chdir(projectRoot);
      return createFingerprintFileAsync(projectRoot, destinationDir, platform, true);
    })
    .catch(warnFingerprintEmbedFailed);
}
