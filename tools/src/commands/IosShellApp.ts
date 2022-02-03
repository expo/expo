import { IosShellApp, ImageUtils } from '@expo/xdl';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import * as Directories from '../Directories';

async function resizeIconWithSharpAsync(
  iconSizePx: number,
  iconFilename: string,
  destinationIconPath: string
) {
  const filename = path.join(destinationIconPath, iconFilename);

  // sharp can't have same input and output filename, so load to buffer then
  // write to disk after resize is complete
  let buffer = await sharp(filename).resize(iconSizePx, iconSizePx).toBuffer();

  fs.writeFileSync(filename, buffer);
}

async function getImageDimensionsWithSharpAsync(dirname: string, basename: string) {
  const filename = path.join(dirname, basename);
  try {
    let { width, height } = await sharp(filename).metadata();
    return { width, height };
  } catch (e) {
    return null;
  }
}

type ActionOptions = {
  action: string;
  [key: string]: any;
};

async function action(providedOptions: ActionOptions) {
  ImageUtils.setResizeImageFunction(resizeIconWithSharpAsync);
  ImageUtils.setGetImageDimensionsFunction(getImageDimensionsWithSharpAsync);

  const options = {
    ...providedOptions,
    expoSourcePath: Directories.getIosDir(),
  };

  if (options.action === 'build') {
    // in building shell apps, `app.manifest` in expo-updates is not necessary.
    process.env['SKIP_BUNDLING'] = '1';
    return await IosShellApp.buildAndCopyArtifactAsync(options);
  } else if (options.action === 'configure') {
    return await IosShellApp.configureAndCopyArchiveAsync(options);
  } else if (options.action === 'create-workspace') {
    return await IosShellApp.createTurtleWorkspaceAsync(options);
  } else {
    throw new Error(`Unsupported action '${options.action}'.`);
  }
}

export default (program: any) => {
  program
    .command('ios-shell-app')
    .description('Generates and builds an iOS shell app locally with the specified configuration')
    .option('-a, --action [string]', 'Action to perform: configure | build | create-workspace')
    .option('-u, --url [string]', 'Manifest URL')
    .option('-s, --sdkVersion [string]', 'SDK version to use when requesting the manifest')
    .option('--shellAppSdkVersion [string]', 'SDK version for the shell app', 'UNVERSIONED')
    .option('-r, --releaseChannel [string]', 'Release channel')
    .option('--manifest [string]', 'App manifest')
    .option('--skipRepoUpdate', 'Include if you want the CocoaPods repo update to be skipped')
    .option('-t, --type [string]', 'Type of build: simulator | archive | client', 'archive')
    .option('-c, --configuration [string]', 'Build configuration: Debug | Release', 'Release')
    .option('-v, --verbose [boolean]', 'Print verbose output', false)
    .option(
      '--testEnvironment [string]',
      'Test environment for the shell app: local | ci | none',
      'none'
    )
    .option(
      '--privateConfigFile [string]',
      'Path to a private config file containing, e.g., private api keys'
    )
    .option('--appleTeamId [string]', `Apple Developer's account Team ID`)
    .option('--archivePath [string]', 'Path to existing NSBundle to configure (optional)')
    .option('--output [string]', 'Path where the archive should be created (optional)')
    .option(
      '--workspacePath [string]',
      'Path for the unbuilt xcode workspace to create/use (optional)'
    )
    .option(
      '--packagesToInstallWhenEjecting [string]',
      'Overridden packages to install when ejecting, in JSON object as string, e.g. \'{"react-native":"^0.64.2"}\''
    )
    .asyncAction(action);
};
