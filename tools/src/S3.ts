import spawnAsync from '@expo/spawn-async';
import aws from 'aws-sdk';
import { SpawnOptions } from 'child_process';
import fse from 'fs-extra';
import os from 'os';
import path from 'path';

export const S3_BUCKET = 'exp-artifacts';
export const S3_URL = `s3://${S3_BUCKET}`;
export const S3_WEBSITE_PATH = `build-artifacts.exp.host`;

export async function addRedirectAsync(from: string, to: string): Promise<void> {
  from = from.replace(new RegExp(`^s3:\/\/${S3_BUCKET}\/?`), '');

  const s3 = await _s3ClientAsync();
  await s3
    .putObject({
      Bucket: S3_BUCKET,
      CacheControl: 'no-cache',
      Key: `${to}`,
      Body: '',
      ACL: 'public-read',
      WebsiteRedirectLocation: `/${from.replace(/^\//, '')}`,
    })
    .promise();
}

export function getURI(path: string): string {
  return `http://${S3_WEBSITE_PATH}/${path.replace(/^\//, '')}`;
}

export async function getCachedArtifactAsync(
  key: string,
  destFile: string,
  createArtifactAsync: () => Promise<void>,
  options: { [key: string]: any } = {}
) {
  try {
    await downloadAsync(key, destFile, options);
  } catch {
    await createArtifactAsync();
  }
}

export async function uploadAsync(
  sourceFile: string,
  key: string,
  options: { [key: string]: any } = {}
): Promise<string> {
  const file = fse.createReadStream(sourceFile);

  const s3 = await _s3ClientAsync();
  await s3
    .putObject({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ACL: 'public-read',
      ...options,
    })
    .promise();

  return `https://s3.amazonaws.com/${options.Bucket || S3_BUCKET}/${key}`;
}

export async function downloadAsync(
  key: string,
  destFile: string,
  options: { [key: string]: any } = {}
): Promise<void> {
  const s3 = await _s3ClientAsync();
  return new Promise<void>((resolve, reject) => {
    const file = fse.createWriteStream(destFile);

    const reader = s3
      .getObject({
        Bucket: S3_BUCKET,
        Key: key,
        ...options,
      })
      .createReadStream();

    file
      .on('error', (e) => {
        reject(e);
      })
      .on('close', () => {
        resolve();
      });

    reader
      .on('error', (e) => {
        reject(e);
      })
      .pipe(file);
  });
}

export async function downloadFromRedirectAsync(s3Path: string, dest: string): Promise<void> {
  const s3 = await _s3ClientAsync();

  const { WebsiteRedirectLocation: redirect } = await s3
    .headObject({
      Bucket: S3_BUCKET,
      Key: s3Path,
    })
    .promise();

  if (redirect) {
    s3Path = redirect.replace(/^\//, '');
  }

  return new Promise<void>((resolve, reject) => {
    const reader = s3
      .getObject({
        Bucket: S3_BUCKET,
        Key: s3Path,
      })
      .createReadStream();
    const file = fse.createWriteStream(dest);

    file
      .on('error', (e) => {
        reject(e);
      })
      .on('close', () => {
        resolve();
      });

    reader
      .on('error', (e) => {
        reject(e);
      })
      .pipe(file);
  });
}

export async function _s3ClientAsync(): Promise<aws.S3> {
  if (
    process.env.CI_S3_ACCESS_KEY_ID &&
    process.env.CI_S3_SECRET_ACCESS_KEY &&
    process.env.CI_S3_DEFAULT_REGION
  ) {
    aws.config.update({
      accessKeyId: process.env.CI_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.CI_S3_SECRET_ACCESS_KEY,
      region: process.env.CI_S3_DEFAULT_REGION,
    });
  } else {
    console.log('Defaulting to AWS credentials on developer machine.');
  }

  return new aws.S3({ region: 'us-east-1' });
}

/*
 * `directories` is an array of objects that look like:
 * {
 *   source: absolute path to a directory,
 *   destination: relative path in the resulting tarball,
 * }
 * These will all be zipped up and uploaded to the specified bucket.
 */
export async function uploadDirectoriesAsync(
  bucket: string,
  key: string,
  directories: { source: string; destination: string; isFile?: boolean }[]
): Promise<void> {
  const dirname = await fse.mkdtemp(path.join(os.tmpdir(), '-pt-upload'));
  const tmpDir = path.join(dirname, 'upload-directories-tmp');
  const tmpTarGz = path.join(dirname, 'upload-directories-tmp-targz.tar.gz');
  const spawnOptions: SpawnOptions = {
    stdio: 'inherit',
    cwd: dirname,
  };

  await spawnAsync('mkdir', ['-p', tmpDir], spawnOptions);

  const excludeFile = path.join(dirname, 'excludeFile.txt');
  for (const directory of directories) {
    if (directory.isFile) {
      await spawnAsync(
        'cp',
        [directory.source, path.join(tmpDir, directory.destination)],
        spawnOptions
      );
    } else {
      await spawnAsync('mkdir', ['-p', path.join(tmpDir, directory.destination)], spawnOptions);
      // Exclude files that are not tracked in git
      const gitCommand = await spawnAsync(
        'git',
        ['-C', '.', 'ls-files', '--exclude-standard', '-oi', '--directory'],
        {
          cwd: directory.source,
        }
      );
      const gitCommandOutput = gitCommand.stdout.toString();
      await fse.writeFile(excludeFile, gitCommandOutput);
      await spawnAsync(
        'rsync',
        [
          '-azP',
          '--exclude=.git',
          `--exclude-from=${excludeFile}`,
          '.',
          path.join(tmpDir, directory.destination),
        ],
        {
          stdio: 'inherit',
          cwd: directory.source,
        }
      );
    }
  }

  await spawnAsync(
    'tar',
    ['-zcvf', tmpTarGz, '-C', tmpDir, '--exclude', '__internal__', '.'],
    spawnOptions
  );

  const s3 = await _s3ClientAsync();
  const file = fse.createReadStream(tmpTarGz);
  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: file,
      ACL: 'public-read',
    })
    .promise();

  await spawnAsync('rm', [tmpTarGz], spawnOptions);
  await spawnAsync('rm', ['-rf', tmpDir], spawnOptions);
}
