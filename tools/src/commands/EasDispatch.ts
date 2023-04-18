import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs, { mkdirp } from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

const RELEASE_BUILD_PROFILE = 'release-client';

const CUSTOM_ACTIONS = {
  'ios-client-build-and-submit': {
    name: 'Build a new iOS client and submit it to the App Store',
    actionId: 'ios-client-build-and-submit',
    action: iosBuildAndSubmitAsync,
  },
  'android-client-build-and-submit': {
    name: 'Build a new Android client and submit it to the Play Store',
    actionId: 'android-client-build-and-submit',
    action: androidBuildAndSubmitAsync,
  },
};

export default (program: Command) => {
  program
    .command('eas-dispatch [action]')
    .alias('eas')
    .description(`Runs predefined EAS Build & Submit jobs.`)
    .asyncAction(main);
};

async function main(actionId: string | undefined) {
  if (!actionId || !CUSTOM_ACTIONS[actionId]) {
    const actions = Object.values(CUSTOM_ACTIONS).map((i) => `\n- ${i.actionId} - ${i.name}`);
    if (!actionId) {
      logger.error(`You need to provide action name. Select one of: ${actions}`);
    } else {
      logger.error(`Unknown action ${actionId}. Select one of: ${actions}`);
    }
    return;
  }

  CUSTOM_ACTIONS[actionId].action();
}

async function iosBuildAndSubmitAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  const credentialsDir = path.join(projectDir, 'credentials');
  const fastlaneMatchBucketCopyPath = path.join(credentialsDir, 'fastlane-match');
  const releaseSecretsPath = path.join(credentialsDir, 'secrets');
  await mkdirp(fastlaneMatchBucketCopyPath);
  await mkdirp(releaseSecretsPath);
  await spawnAsync('gsutil', [
    'rsync',
    '-r',
    '-d',
    'gs://expo-client-certificates',
    fastlaneMatchBucketCopyPath,
  ]);
  await spawnAsync('gsutil', [
    'rsync',
    '-r',
    '-d',
    'gs://expo-go-release-secrets',
    releaseSecretsPath,
  ]);

  const privateKeyMatches = glob.sync('*/certs/distribution/*.p12', {
    absolute: true,
    cwd: fastlaneMatchBucketCopyPath,
  });
  assert(privateKeyMatches.length === 1);
  const privateKeyPath = privateKeyMatches[0];

  const certDERMatches = glob.sync('*/certs/distribution/*.cer', {
    absolute: true,
    cwd: fastlaneMatchBucketCopyPath,
  });
  assert(certDERMatches.length === 1);
  const certDERPath = certDERMatches[0];

  const certPEMPath = path.join(credentialsDir, 'cert.pem');
  const p12KeystorePath = path.join(credentialsDir, 'dist.p12');
  const p12KeystorePassword = uuidv4();

  await spawnAsync('openssl', ['x509', '-inform', 'der', '-in', certDERPath, '-out', certPEMPath]);
  await spawnAsync('openssl', [
    'pkcs12',
    '-export',
    '-legacy',
    '-out',
    p12KeystorePath,
    '-inkey',
    privateKeyPath,
    '-in',
    certPEMPath,
    '-password',
    `pass:${p12KeystorePassword}`,
  ]);

  // TODO
  // - Enable auto-increment on release-client build profile
  // - Add --auto-submit option

  await fs.writeFile(
    path.join(projectDir, 'credentials.json'),
    JSON.stringify({
      ios: {
        'Expo Go (versioned)': {
          provisioningProfilePath: path.join(
            fastlaneMatchBucketCopyPath,
            'C8D8QTF339/profiles/appstore/AppStore_host.exp.Exponent.mobileprovision'
          ),
          distributionCertificate: {
            path: p12KeystorePath,
            password: p12KeystorePassword,
          },
        },
        ExpoNotificationServiceExtension: {
          provisioningProfilePath: path.join(
            fastlaneMatchBucketCopyPath,
            'C8D8QTF339/profiles/appstore/AppStore_host.exp.Exponent.ExpoNotificationServiceExtension.mobileprovision'
          ),
          distributionCertificate: {
            path: p12KeystorePath,
            password: p12KeystorePassword,
          },
        },
      },
    })
  );

  await spawnAsync('eas', ['build', '--platform', 'ios', '--profile', RELEASE_BUILD_PROFILE], {
    cwd: projectDir,
    stdio: 'inherit',
  });
}

async function androidBuildAndSubmitAsync() {
  const projectDir = path.join(EXPO_DIR, 'apps/eas-expo-go');
  const credentialsDir = path.join(projectDir, 'credentials');
  const releaseSecretsPath = path.join(credentialsDir, 'secrets');
  await mkdirp(releaseSecretsPath);

  const keystorePath = path.join(releaseSecretsPath, 'android-keystore.jks');
  const keystorePasswordPath = path.join(releaseSecretsPath, 'android-keystore.password');
  const keystoreAliasPasswordPath = path.join(
    releaseSecretsPath,
    'android-keystore-alias.password'
  );

  await spawnAsync('gsutil', [
    'rsync',
    '-r',
    '-d',
    'gs://expo-go-release-secrets',
    releaseSecretsPath,
  ]);

  // TODO:
  // - Change track to production (using internal track for testing)
  // - Enable auto-increment on release-client build profile
  // - Add --auto-submit option

  await fs.writeFile(
    path.join(projectDir, 'credentials.json'),
    JSON.stringify({
      android: {
        keystore: {
          keystorePath,
          keystorePassword: (await fs.readFile(keystorePasswordPath, 'utf-8')).trim(),
          keyAlias: 'ExponentKey',
          keyPassword: (await fs.readFile(keystoreAliasPasswordPath, 'utf-8')).trim(),
        },
      },
    })
  );

  await spawnAsync('eas', ['build', '--platform', 'android', '--profile', RELEASE_BUILD_PROFILE], {
    cwd: projectDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EAS_DANGEROUS_OVERRIDE_ANDROID_APPLICATION_ID: 'host.exp.exponent',
    },
  });
}
