import chalk from 'chalk';

import { diffFingerprints } from '../../../build/index';
import { Command } from '../cli';
import { assertArgs, getFileArgumentAtIndex } from '../utils/args';
import { CommandError } from '../utils/errors';
import * as Log from '../utils/log';
import readFingerprintFileAsync from '../utils/readFingerprintFileAsync';

export const diffFingerprintsAsync: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Diff two fingerprints

{bold Usage}
  {dim $} npx @expo/fingerprint fingerprint:diff <fingerprintFile1> <fingerprintFile2>

  Options
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const fingerprintFile1 = getFileArgumentAtIndex(args, 0);
  const fingerprintFile2 = getFileArgumentAtIndex(args, 1);

  const [fingeprint1ToDiff, fingerprint2ToDiff] = await Promise.all([
    readFingerprintFileAsync(fingerprintFile1),
    readFingerprintFileAsync(fingerprintFile2),
  ]);
  try {
    const diff = diffFingerprints(fingeprint1ToDiff, fingerprint2ToDiff);
    console.log(JSON.stringify(diff, null, 2));
  } catch (e: any) {
    throw new CommandError(e.message);
  }
};
