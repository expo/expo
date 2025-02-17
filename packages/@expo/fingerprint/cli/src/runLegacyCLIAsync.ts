import readFingerprintFileAsync from './utils/readFingerprintFileAsync.js';
import {
  createFingerprintAsync,
  diffFingerprintChangesAsync,
  diffFingerprints,
} from '../../build/index.js';

export async function runLegacyCLIAsync(args: string[]) {
  if (args.length !== 1 && args.length !== 2 && args.length !== 3) {
    console.log(
      `Usage: npx @expo/fingerprint <projectRoot> [fingerprintFile1ToDiff] [fingerprintFile2ToDiff]`
    );
    process.exit(1);
  }

  const projectRoot = args[0];

  const fingerprintFile1ToDiff = args[1];
  const fingerprintFile2ToDiff = args[2];

  const [fingerprint1ToDiff, fingerprint2ToDiff] = await Promise.all([
    fingerprintFile1ToDiff ? readFingerprintFileAsync(fingerprintFile1ToDiff) : null,
    fingerprintFile2ToDiff ? readFingerprintFileAsync(fingerprintFile2ToDiff) : null,
  ]);

  const options = {
    debug: !!process.env.DEBUG,
    useRNCoreAutolinkingFromExpo: process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO
      ? ['1', 'true'].includes(process.env.USE_RNCORE_AUTOLINKING_FROM_EXPO)
      : undefined,
  };
  try {
    if (fingerprint1ToDiff && fingerprint2ToDiff) {
      const diff = diffFingerprints(fingerprint1ToDiff, fingerprint2ToDiff);
      console.log(JSON.stringify(diff, null, 2));
    } else if (fingerprint1ToDiff) {
      const diff = await diffFingerprintChangesAsync(fingerprint1ToDiff, projectRoot, options);
      console.log(JSON.stringify(diff, null, 2));
    } else {
      const fingerprint = await createFingerprintAsync(projectRoot, options);
      console.log(JSON.stringify(fingerprint, null, 2));
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
}
