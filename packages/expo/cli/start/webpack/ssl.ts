import * as devcert from '@expo/devcert';
import chalk from 'chalk';
import fs from 'fs/promises';
import * as path from 'path';

import { ensureDirectoryAsync } from '../../utils/dir';

export async function ensureEnvironmentSupportsSSLAsync(projectRoot: string) {
  if (!process.env.SSL_CRT_FILE || !process.env.SSL_KEY_FILE) {
    const ssl = await getSSLCertAsync({
      name: 'localhost',
      directory: projectRoot,
    });
    if (ssl) {
      process.env.SSL_CRT_FILE = ssl.certPath;
      process.env.SSL_KEY_FILE = ssl.keyPath;
    }
  }
}

async function getSSLCertAsync({
  name,
  directory,
}: {
  name: string;
  directory: string;
}): Promise<{ keyPath: string; certPath: string } | false> {
  console.log(
    chalk.magenta`Ensuring auto SSL certificate is created (you might need to re-run with sudo)`
  );
  try {
    const result = await devcert.certificateFor(name);
    if (result) {
      const { key, cert } = result;
      const folder = path.join(directory, '.expo', 'web', 'development', 'ssl');
      await ensureDirectoryAsync(folder);

      const keyPath = path.join(folder, `key-${name}.pem`);
      await fs.writeFile(keyPath, key);

      const certPath = path.join(folder, `cert-${name}.pem`);
      await fs.writeFile(certPath, cert);

      return {
        keyPath,
        certPath,
      };
    }
    return result;
  } catch (error) {
    console.log(`Error creating SSL certificates: ${error}`);
  }

  return false;
}
