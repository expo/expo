import { certificateFor } from '@expo/devcert';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

import * as Log from '../../../log';
import { ensureDirectoryAsync } from '../../../utils/dir';
import { ensureDotExpoProjectDirectoryInitialized } from '../../project/dotExpo';

// TODO: Move to doctor as a prereq.

/** Ensure TLS is setup and environment variables are set. */
export async function ensureEnvironmentSupportsTLSAsync(
  projectRoot: string,
  props: { name?: string } = {}
): Promise<
  | false
  | {
      keyPath: string;
      certPath: string;
    }
> {
  if (!process.env.SSL_CRT_FILE || !process.env.SSL_KEY_FILE) {
    const tls = await getTLSCertAsync(projectRoot, props);
    if (tls) {
      process.env.SSL_CRT_FILE = tls.certPath;
      process.env.SSL_KEY_FILE = tls.keyPath;
    }
    return tls;
  }
  return {
    keyPath: process.env.SSL_KEY_FILE,
    certPath: process.env.SSL_CRT_FILE,
  };
}

/** Create TLS and write to files in the temporary directory. Exposed for testing. */
export async function getTLSCertAsync(
  projectRoot: string,
  { name = 'localhost' }: { name?: string } = {}
): Promise<{ keyPath: string; certPath: string } | false> {
  Log.log(
    chalk`Creating TLS certificate for localhost. {dim This functionality may not work on all computers.}`
  );

  const result = await certificateFor(name);
  if (result) {
    const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);

    const { key, cert } = result;
    const folder = path.join(dotExpoDir, 'tls');
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
