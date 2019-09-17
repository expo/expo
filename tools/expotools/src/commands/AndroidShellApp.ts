import { AndroidShellApp } from '@expo/xdl';
import * as Directories from '../Directories';

type ActionOptions = {
  url: string;
  sdkVersion: string;
  releaseChannel?: string;
  keystore?: string;
  keystoreAlias?: string;
  keystorePassword?: string;
  keyPassword?: string;
  buildType?: string;
  buildMode?: string;
  modules?: string;
};

async function action(options: ActionOptions) {
  if (!options.url || !options.sdkVersion) {
    throw new Error('Must run with `--url MANIFEST_URL --sdkVersion SDK_VERSION`');
  }

  AndroidShellApp.createAndroidShellAppAsync({
    buildMode: options.keystore ? 'release' : 'debug',
    buildType: 'apk',
    workingDir: Directories.getExpoRepositoryRootDir(),
    ...options,
    alias: options.keystoreAlias,
  });
}

export default (program: any) => {
  program
    .command('android-shell-app')
    .description(
      'Generates and builds an Android shell app locally with the specified configuration'
    )
    .option('-u, --url [string]', 'Manifest URL')
    .option('-s, --sdkVersion [string]', 'SDK version')
    .option('-r, --releaseChannel [string]', 'Release channel')
    .option('-t, --buildType [string]', 'type of build: app-bundle|apk (default: apk)')
    .option(
      '-m, --buildMode [string]',
      'mode of build: debug|release (defaults to release if keystore is provided, debug otherwise)'
    )
    .option(
      '--modules [string]',
      'list of modules to include in the build (defaults to all modules)'
    )
    .option('--keystore [string]', 'Path to keystore (optional)')
    .option('--keystoreAlias [string]', 'Keystore alias (optional)')
    .option('--keystorePassword [string]', 'Keystore password (optional)')
    .option('--keyPassword [string]', 'Key password (optional)')
    .asyncAction(action);
};
