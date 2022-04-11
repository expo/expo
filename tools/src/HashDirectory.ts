import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import globby from 'globby';
import hashFiles from 'hash-files';
import trim from 'lodash/trim';
import path from 'path';

import * as Directories from './Directories';

export async function getListOfFilesAsync(directory: string): Promise<string[]> {
  const expoGitignore = fs.readFileSync(
    path.join(Directories.getExpoRepositoryRootDir(), '.gitignore'),
    'utf8'
  );
  let directoryGitignore = '';
  try {
    directoryGitignore = fs.readFileSync(path.join(directory, '.gitignore'), 'utf8');
  } catch {
    // Don't worry if we can't find this gitignore
  }
  const gitignoreLines = [...expoGitignore.split('\n'), ...directoryGitignore.split('\n')].filter(
    (line) => {
      return trim(line).length > 0 && !trim(line).startsWith('#');
    }
  );

  const gitignoreGlobPatterns: string[] = [];

  gitignoreLines.forEach((line) => {
    // Probably doesn't cover every gitignore possiblity but works better than the gitignore-to-glob
    // package on npm
    let firstCharacter = '';
    if (line.startsWith('!')) {
      line = line.substring(1);
    } else {
      firstCharacter = '!';
    }

    if (line.startsWith('/')) {
      line = line.substring(1);
    }

    gitignoreGlobPatterns.push(firstCharacter + line);
    gitignoreGlobPatterns.push(firstCharacter + line + '/**');
    gitignoreGlobPatterns.push(firstCharacter + '/**' + line);
    gitignoreGlobPatterns.push(firstCharacter + '/**' + line + '/**');
  });

  const files = await globby(['**', ...gitignoreGlobPatterns], {
    cwd: directory,
  });
  return files.map((file) => path.resolve(directory, file));
}

export async function hashFilesAsync(options: { [key: string]: any }): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    hashFiles(options, (error, hash) => {
      if (error) {
        reject(error);
      } else {
        resolve(hash);
      }
    });
  });
}

export async function hashDirectoryAsync(directory: string): Promise<string> {
  const files = await getListOfFilesAsync(directory);
  const hash = await hashFilesAsync({
    files,
    noGlob: true,
  });

  return hash;
}

export async function hashDirectoryWithVersionsAsync(directory: string): Promise<string> {
  // Add Node and Yarn versions to the hash
  const yarnVersion = (await spawnAsync('yarn', ['--version'])).stdout;
  const metadataFilename = path.join(directory, 'HASH_DIRECTORY_METADATA');
  fs.writeFileSync(
    metadataFilename,
    `NODE_VERSION=${process.version}
YARN_VERSION=${yarnVersion}`
  );

  const hash = await hashDirectoryAsync(directory);

  fs.unlinkSync(metadataFilename);
  return hash;
}
