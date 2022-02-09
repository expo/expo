import * as devcert from '@expo/devcert';
import fs from 'fs/promises';
import * as path from 'path';

import * as Log from '../../log';
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
  Log.log(`Ensuring auto SSL certificate is created (you might need to re-run with sudo)`);
  try {
    const result = await devcert.certificateFor(name);
    if (result) {
      const { key, cert } = result;
      const folder = path.join(directory, '.expo', 'web', 'development', 'ssl');
      const keyPath = path.join(folder, `key-${name}.pem`);
      const certPath = path.join(folder, `cert-${name}.pem`);

      await ensureDirectoryAsync(folder);
      await Promise.all([await fs.writeFile(keyPath, key), await fs.writeFile(certPath, cert)]);

      return {
        keyPath,
        certPath,
      };
    }
    return result;
  } catch (error) {
    Log.error(`Error creating SSL certificates: ${error}`);
  }

  return false;
}
