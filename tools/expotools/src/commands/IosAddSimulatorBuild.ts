import aws from 'aws-sdk';
import { UpdateVersions, Config } from '@expo/xdl';

async function action(options) {
  if (!options.app || !options.appVersion) {
    throw new Error('Must run with `--app PATH_TO_APP --appVersion APP_VERSION`');
  }
  const s3 = new aws.S3({ region: 'us-east-1' });

  Config.api.host = 'staging.exp.host';
  await UpdateVersions.updateIOSSimulatorBuild(s3, options.app, options.appVersion);
}

export default (program: any) => {
  program
    .command('ios-add-simulator-build')
    .description('Uploads simulator build to S3 and ')
    .option('--app <string>', 'Path to the Exponent.app archive.')
    .option('--appVersion <string>', 'iOS app version.')
    .asyncAction(action);
};
