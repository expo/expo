import { certificateFor } from '@expo/devcert';
import chalk from 'chalk';
import fs from 'fs/promises';
import * as path from 'path';

import * as Log from '../../../log';
import { ensureDirectoryAsync } from '../../../utils/dir';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';

// TODO: Move to doctor as a prereq.

/** Ensure SSL is setup and environment variables are set. */
export async function ensureEnvironmentSupportsSSLAsync(projectRoot: string) {
  if (!process.env.SSL_CRT_FILE || !process.env.SSL_KEY_FILE) {
    const ssl = await getSSLCertAsync(projectRoot);
    if (ssl) {
      process.env.SSL_CRT_FILE = ssl.certPath;
      process.env.SSL_KEY_FILE = ssl.keyPath;
    }
  }
}

/** Create SSL and write to files in the temporary directory. Exposed for testing. */
export async function getSSLCertAsync(
  projectRoot: string
): Promise<{ keyPath: string; certPath: string } | false> {
  Log.log(
    chalk`Creating SSL certificate for localhost. {dim This functionality may not work on all computers.}`
  );

  const name = 'localhost';
  const result = await certificateFor(name);
  if (result) {
    const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);

    const { key, cert } = result;
    const folder = path.join(dotExpoDir, 'ssl');
    const keyPath = path.join(folder, `key-${name}.pem`);
    const certPath = path.join(folder, `cert-${name}.pem`);

    await ensureDirectoryAsync(folder);
    await Promise.allSettled([fs.writeFile(keyPath, key), fs.writeFile(certPath, cert)]);

    return {
      keyPath,
      certPath,
    };
  }
  return result;
}
