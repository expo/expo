// @ts-check
/// <reference types="node" />

const fs = require('node:fs');
const path = require('node:path');

const FINGERPRINT_FILE_NAME = 'app.fingerprint';

/**
 * Computes the project fingerprint and writes it to `app.fingerprint`, next to `app.config`.
 * The file is the build-time baseline that `npx expo needs-rebuild` compares against.
 *
 * Any previously embedded fingerprint is removed first: the iOS destination directory persists
 * across builds, and a stale hash from an earlier build must never describe a newer binary.
 *
 * Resolves to `null` (without writing) when `enabled` is false (the native build scripts pass
 * false for non-debug builds), when embedding is disabled through
 * `EXPO_SKIP_FINGERPRINT_EMBED`, when the platform is not ios/android, or when
 * `expo/fingerprint` is not installed in the project. Rejects on fingerprint computation
 * errors; the caller decides how to report them (the build script warns and continues).
 *
 * The fingerprint options must stay in sync with the check side in
 * `@expo/cli/src/utils/nativeFingerprint.ts` (`nativeFingerprintOptions`) — a different hash
 * on either side makes `npx expo needs-rebuild` report a permanent mismatch.
 *
 * @param {string} projectRoot
 * @param {string} destinationDir
 * @param {string | undefined} platform
 * @param {boolean} enabled false for non-debug builds; the stale file is still removed
 * @returns {Promise<string | null>} path of the written file, or null when skipped
 */
async function createFingerprintFileAsync(projectRoot, destinationDir, platform, enabled) {
  const filePath = path.join(destinationDir, FINGERPRINT_FILE_NAME);
  fs.rmSync(filePath, { force: true });

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
    // Resolve from the project root — the same anchor as the check side (`@expo/cli` resolves
    // `expo/fingerprint` from the project too). A module-relative require could load a different
    // copy in a hoisted monorepo, embedding a hash the check side can never reproduce.
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

  fs.writeFileSync(filePath, hash);
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
  // The fingerprint is optional metadata for `npx expo needs-rebuild` — never fail the build.
  console.warn(
    `Could not embed the project fingerprint (app.fingerprint): ${error.message}. ` +
      `The build continues normally, but \`npx expo needs-rebuild\` cannot verify this build until a build with an embedded fingerprint succeeds.`
  );
}

module.exports = { createFingerprintFileAsync, warnFingerprintEmbedFailed, FINGERPRINT_FILE_NAME };

// Direct invocation from the Android build: the gradle script registers the fingerprint task
// for debuggable variants only, so `enabled` is always true here. Loading the project env vars
// before computing keeps the hash identical to the check side (`npx expo needs-rebuild`).
if (require.main === module) {
  const projectRoot = process.argv[2];
  const destinationDir = process.argv[3];
  const platform = process.argv[4];
  require('@expo/env').load(projectRoot);
  process.chdir(projectRoot);
  createFingerprintFileAsync(projectRoot, destinationDir, platform, true).catch(
    warnFingerprintEmbedFailed
  );
}
