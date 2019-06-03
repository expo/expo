import { UpdateVersions, Config } from '@expo/xdl';

async function action(options) {
  const { sdk, platform } = options;

  // (dsokal) commander.js doesn't check if required options are supplied, lol
  if (!sdk || !platform) {
    throw new Error('Must run with `--sdk SDK_VERSION --platform PLATFORM`');
  }

  if (!['android', 'ios', 'both'].includes(platform)) {
    throw new Error('Invalid platform (only `android`, `ios` and `both` are allowed here)');
  }

  Config.api.host = 'staging.exp.host';
  await UpdateVersions.updateTurtleVersionAsync(sdk, platform);
}

export default program => {
  program
    .command('update-turtle-sdk-version')
    .option('--sdk <string>', 'SDK version')
    .option('--platform <string>', 'Platform (`android`, `ios` or `both`) on which to apply change')
    .description(
      `
  Updates SDK version supported by Turtle on staging (creates a new record in versions table in rethink).
  Use promote-versions-to-prod to update SDK version on production.
      `
    )
    .asyncAction(action);
};
