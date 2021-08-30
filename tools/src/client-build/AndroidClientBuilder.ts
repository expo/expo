import fs from 'fs-extra';
import path from 'path';

import { ANDROID_DIR } from '../Constants';
import { androidAppVersionAsync } from '../ProjectVersions';
import { spawnAsync } from '../Utils';
import { ClientBuilder, ClientBuildFlavor, Platform, S3Client } from './types';

export default class AndroidClientBuilder implements ClientBuilder {
  platform: Platform = 'android';

  getAppPath(): string {
    return path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
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
  }

  async uploadBuildAsync(s3Client: S3Client, appVersion: string) {
    const file = fs.createReadStream(this.getAppPath());

    await s3Client
      .putObject({
        Bucket: 'exp-android-apks',
        Key: `Exponent-${appVersion}.apk`,
        Body: file,
        ACL: 'public-read',
      })
      .promise();
  }
}
