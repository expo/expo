import fs from 'fs-extra';
import path from 'path';

import { ClientBuilder, ClientBuildFlavor, Platform, S3Client } from './types';
import { EXPO_GO_ANDROID_DIR } from '../Constants';
import logger from '../Logger';
import { androidAppVersionAsync } from '../ProjectVersions';
import { spawnAsync } from '../Utils';

export default class AndroidClientBuilder implements ClientBuilder {
  platform: Platform = 'android';

  getAppPath(): string {
    return path.join(
      EXPO_GO_ANDROID_DIR,
      'app',
      'build',
      'outputs',
      'apk',
      'versioned',
      'release',
      'app-versioned-release.apk'
    );
  }

  getClientUrl(appVersion: string): string {
    return `https://d1ahtucjixef4r.cloudfront.net/Exponent-${appVersion}.apk`;
  }

  async getAppVersionAsync(): Promise<string> {
    return androidAppVersionAsync();
  }

  async buildAsync(flavor: ClientBuildFlavor = ClientBuildFlavor.VERSIONED) {
    await spawnAsync('fastlane', ['android', 'build', 'build_type:Release', `flavor:${flavor}`], {
      stdio: 'inherit',
    });

    if (flavor === ClientBuildFlavor.VERSIONED) {
      logger.info('Uploading Crashlytics symbols');
      await spawnAsync('fastlane', ['android', 'upload_crashlytics_symbols', `flavor:${flavor}`], {
        stdio: 'inherit',
      });
    }
  }

  async uploadBuildAsync(s3Client: S3Client, appVersion: string) {
    const file = fs.createReadStream(this.getAppPath());

    await s3Client.putObject({
      Bucket: 'exp-android-apks',
      Key: `Exponent-${appVersion}.apk`,
      Body: file,
      ACL: 'public-read',
    });
  }
}
