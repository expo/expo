import { getConfig } from '@expo/config';
import chalk from 'chalk';

import { Options } from './resolveOptions';
import { Log } from '../../log';
import { WebSupportProjectPrerequisite } from '../../start/doctor/web/WebSupportProjectPrerequisite';
import { getPlatformBundlers } from '../../start/server/platformBundlers';
import { WebpackBundlerDevServer } from '../../start/server/webpack/WebpackBundlerDevServer';
import { CommandError } from '../../utils/errors';
import { setNodeEnv } from '../../utils/nodeEnv';

export async function exportWebAsync(projectRoot: string, options: Options) {
  // Ensure webpack is available
  await new WebSupportProjectPrerequisite(projectRoot).assertAsync();

  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  const { exp } = getConfig(projectRoot);
  const platformBundlers = getPlatformBundlers(projectRoot, exp);
  // Create a bundler interface
  const bundler = new WebpackBundlerDevServer(projectRoot, platformBundlers);

  // If the user set `web.bundler: 'metro'` then they should use `expo export` instead.
  if (!bundler.isTargetingWeb()) {
    throw new CommandError(
      chalk`{bold expo export:web} can only be used with Webpack. Use {bold expo export} for other bundlers.`
    );
  }

  Log.log(`Exporting with Webpack...`);

  // Bundle the app
  await bundler.bundleAsync({
    mode: options.dev ? 'development' : 'production',
    clear: options.clear,
  });
}
