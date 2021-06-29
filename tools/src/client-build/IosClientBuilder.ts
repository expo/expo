import fs from 'fs-extra';
import path from 'path';

import { podInstallAsync } from '../CocoaPods';
import { EXPO_DIR, IOS_DIR } from '../Constants';
import { iosAppVersionAsync } from '../ProjectVersions';
import { spawnAsync } from '../Utils';
import { ClientBuilder, ClientBuildFlavor, Platform } from './types';

export default class IosClientBuilder implements ClientBuilder {
  platform: Platform = 'ios';

  getAppPath(): string {
    return path.join(
      IOS_DIR,
      'simulator-build',
      'Build',
      'Products',
      'Release-iphonesimulator',
      'Expo Go.app'
    );
  }

  getClientUrl(appVersion: string): string {
    return `https://dpq5q02fu5f55.cloudfront.net/Exponent-${appVersion}.tar.gz`;
  }

  async getAppVersionAsync(): Promise<string> {
    return await iosAppVersionAsync();
  }

  async buildAsync(flavor: ClientBuildFlavor = ClientBuildFlavor.VERSIONED) {
    await podInstallAsync(IOS_DIR, {
      stdio: 'inherit',
    });
    await spawnAsync('fastlane', ['ios', 'create_simulator_build', `flavor:${flavor}`], {
      stdio: 'inherit',
    });
  }

  async uploadBuildAsync(s3Client, appVersion: string) {
    const tempAppPath = path.join(EXPO_DIR, 'temp-app.tar.gz');

    await spawnAsync('tar', ['-zcvf', tempAppPath, '-C', this.getAppPath(), '.'], {
      stdio: ['ignore', 'ignore', 'inherit'], // only stderr
    });

    const file = fs.createReadStream(tempAppPath);

    await s3Client
      .putObject({
        Bucket: 'exp-ios-simulator-apps',
        Key: `Exponent-${appVersion}.tar.gz`,
        Body: file,
        ACL: 'public-read',
      })
      .promise();

    await fs.remove(tempAppPath);
  }
}
