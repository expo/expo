import { Log } from '../../log';
import { WebSupportProjectPrerequisite } from '../../start/doctor/web/WebSupportProjectPrerequisite';
import { WebpackBundlerDevServer } from '../../start/server/webpack/WebpackBundlerDevServer';
import { Options } from './resolveOptions';

export async function exportWebAsync(projectRoot: string, options: Options) {
  // Ensure webpack is available
  await new WebSupportProjectPrerequisite(projectRoot).assertAsync();

  // Create a bundler interface
  const bundler = new WebpackBundlerDevServer(projectRoot, false);

  Log.log(`Exporting with Webpack...`);

  // Bundle the app
  await bundler.bundleAsync({
    mode: options.dev ? 'development' : 'production',
    clear: options.clear,
  });
}
