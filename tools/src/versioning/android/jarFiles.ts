import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { EXPOTOOLS_DIR } from '../../Constants';

export async function buildManifestMergerJarAsync(): Promise<string> {
  const manifestMergerDir = path.join(
    EXPOTOOLS_DIR,
    'src',
    'versioning',
    'android',
    'android-manifest-merger'
  );
  await spawnAsync('./gradlew', ['build'], {
    cwd: manifestMergerDir,
    stdio: 'ignore',
  });
  const buildDir = path.join(manifestMergerDir, 'app', 'build');
  const tarBall = path.join(buildDir, 'distributions', 'app.tar');
  assert(fs.existsSync(tarBall), `Expected ${tarBall} to exist`);
  await spawnAsync('tar', ['-xf', tarBall, '-C', buildDir], {
    cwd: manifestMergerDir,
    stdio: 'ignore',
  });
  const executablePath = path.join(buildDir, 'app', 'bin', 'app');
  assert(fs.existsSync(executablePath), `Expected ${executablePath} to exist`);
  return executablePath;
}
