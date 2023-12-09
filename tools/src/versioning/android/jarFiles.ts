import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { EXPOTOOLS_DIR } from '../../Constants';

export async function buildManifestMergerJarAsync(): Promise<string> {
  return buildJavaToolkitsAsync('android-manifest-merger');
}

export async function buildKotlinMetadataStripperJarAsync(): Promise<string> {
  return buildJavaToolkitsAsync('kotlin-metadata-stripper');
}

export async function buildJavaToolkitsAsync(appName: string): Promise<string> {
  const javaToolkitsRoot = path.join(
    EXPOTOOLS_DIR,
    'src',
    'versioning',
    'android',
    'java-toolkits'
  );

  await spawnAsync('./gradlew', ['build'], {
    cwd: javaToolkitsRoot,
    stdio: 'ignore',
  });
  const buildDir = path.join(javaToolkitsRoot, appName, 'build');
  const tarBall = path.join(buildDir, 'distributions', `${appName}.tar`);
  assert(fs.existsSync(tarBall), `Expected ${tarBall} to exist`);
  await spawnAsync('tar', ['-xf', tarBall, '-C', buildDir], {
    cwd: javaToolkitsRoot,
    stdio: 'ignore',
  });
  const executablePath = path.join(buildDir, appName, 'bin', appName);
  assert(fs.existsSync(executablePath), `Expected ${executablePath} to exist`);
  return executablePath;
}
