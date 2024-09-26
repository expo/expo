/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, getConfig, modifyConfigAsync, PackageJSONConfig } from '@expo/config';
import getMetroAssets from '@expo/metro-config/build/transform-worker/getAssets';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import { sync as globSync } from 'glob';
import Server from 'metro/src/Server';
import splitBundleOptions from 'metro/src/lib/splitBundleOptions';
import output from 'metro/src/shared/output/bundle';
import type { BundleOptions } from 'metro/src/shared/types';
import { execSync } from 'node:child_process';
import path from 'path';
import resolveFrom from 'resolve-from';

import { deserializeEagerKey, getExportEmbedOptionsKey, Options } from './resolveOptions';
import {
  isExecutingFromXcodebuild,
  logInXcode,
  logMetroErrorInXcode,
  warnInXcode,
} from './xcodeCompilerLogger';
import { Log } from '../../log';
import { isSpawnResultError } from '../../start/platforms/ios/xcrun';
import { DevServerManager } from '../../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import { loadMetroConfigAsync } from '../../start/server/metro/instantiateMetro';
import { assertMetroPrivateServer } from '../../start/server/metro/metroPrivateServer';
import { serializeHtmlWithAssets } from '../../start/server/metro/serializeHtml';
import {
  getDomComponentHtml,
  DOM_COMPONENTS_BUNDLE_DIR,
} from '../../start/server/middleware/DomComponentsMiddleware';
import { getMetroDirectBundleOptionsForExpoConfig } from '../../start/server/middleware/metroOptions';
import { stripAnsi } from '../../utils/ansi';
import { copyAsync, removeAsync } from '../../utils/dir';
import { env } from '../../utils/env';
import { setNodeEnv } from '../../utils/nodeEnv';
import { isEnableHermesManaged } from '../exportHermes';
import { exportApiRoutesStandaloneAsync } from '../exportStaticAsync';
import { persistMetroAssetsAsync } from '../persistMetroAssets';
import { copyPublicFolderAsync } from '../publicFolder';
import {
  BundleAssetWithFileHashes,
  ExportAssetMap,
  getFilesFromSerialAssets,
  persistMetroFilesAsync,
} from '../saveAssets';
import { CommandError } from '../../utils/errors';
import chalk from 'chalk';
import { disableNetwork } from '../../api/settings';

const debug = require('debug')('expo:export:embed');

function guessCopiedAppleBundlePath(bundleOutput: string) {
  // Ensure the path is familiar before guessing.
  if (!bundleOutput.match(/\/Xcode\/DerivedData\/.*\/Build\/Products\//)) {
    debug('Bundling to non-standard location:', bundleOutput);
    return false;
  }
  const bundleName = path.basename(bundleOutput);
  const bundleParent = path.dirname(bundleOutput);
  const possiblePath = globSync(path.join(bundleParent, `*.app/${bundleName}`), {
    // bundle identifiers can start with dots.
    dot: true,
  })[0];
  debug('Possible path for previous bundle:', possiblePath);
  return possiblePath;
}

export async function exportEmbedAsync(projectRoot: string, options: Options) {
  // The React Native build scripts always enable the cache reset but we shouldn't need this in CI environments.
  // By disabling it, we can eagerly bundle code before the build and reuse the cached artifacts in subsequent builds.
  if (env.CI && options.resetCache) {
    debug('CI environment detected, disabling automatic cache reset');
    options.resetCache = false;
  }

  setNodeEnv(options.dev ? 'development' : 'production');
  require('@expo/env').load(projectRoot);

  // This is an optimized codepath that can occur during `npx expo run` and does not occur during builds from Xcode or Android Studio.
  // Here we reconcile a bundle pass that was run before the native build process. This order can fail faster and is show better errors since the logs won't be obscured by Xcode and Android Studio.
  // This path is also used for automatically deploying server bundles to a remote host.
  const eagerBundleOptions = env.__EXPO_EAGER_BUNDLE_OPTIONS
    ? deserializeEagerKey(env.__EXPO_EAGER_BUNDLE_OPTIONS)
    : null;
  if (eagerBundleOptions) {
    // Get the cache key for the current process to compare against the eager key.
    const inputKey = getExportEmbedOptionsKey(options);

    // If the app was bundled previously in the same process, then we should reuse the Metro cache.
    options.resetCache = false;

    if (eagerBundleOptions.key === inputKey) {
      // Copy the eager bundleOutput and assets to the new locations.
      await removeAsync(options.bundleOutput);

      copyAsync(eagerBundleOptions.options.bundleOutput, options.bundleOutput);

      if (eagerBundleOptions.options.assetsDest && options.assetsDest) {
        copyAsync(eagerBundleOptions.options.assetsDest, options.assetsDest);
      }

      console.log('info: Copied output to binary:', options.bundleOutput);
      return;
    }
    // TODO: sourcemapOutput is set on Android but not during eager. This is tolerable since it doesn't invalidate the Metro cache.
    console.log('  Eager key:', eagerBundleOptions.key);
    console.log('Request key:', inputKey);

    // TODO: We may want an analytic event here in the future to understand when this happens.
    console.warn('warning: Eager bundle does not match new options, bundling again.');
  }

  return exportEmbedInternalAsync(projectRoot, options);
}

export async function exportEmbedInternalAsync(projectRoot: string, options: Options) {
  // Ensure we delete the old bundle to trigger a failure if the bundle cannot be created.
  await removeAsync(options.bundleOutput);

  // The iOS bundle is copied in to the Xcode project, so we need to remove the old one
  // to prevent Xcode from loading the old one after a build failure.
  if (options.platform === 'ios') {
    const previousPath = guessCopiedAppleBundlePath(options.bundleOutput);
    if (previousPath && fs.existsSync(previousPath)) {
      debug('Removing previous iOS bundle:', previousPath);
      await removeAsync(previousPath);
    }
  }

  const { bundle, assets, files } = await exportEmbedBundleAndAssetsAsync(projectRoot, options);

  fs.mkdirSync(path.dirname(options.bundleOutput), { recursive: true, mode: 0o755 });

  // On Android, dom components proxy files should write to the assets directory instead of the res directory.
  // We use the bundleOutput directory to get the assets directory.
  const domComponentProxyOutputDir =
    options.platform === 'android' ? path.dirname(options.bundleOutput) : options.assetsDest;
  const hasDomComponents = domComponentProxyOutputDir && files.size > 0;

  // Persist bundle and source maps.
  await Promise.all([
    output.save(bundle, options, Log.log),

    // Write dom components proxy files.
    hasDomComponents ? persistMetroFilesAsync(files, domComponentProxyOutputDir) : null,
    // Copy public folder for dom components only if
    hasDomComponents
      ? copyPublicFolderAsync(
          path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER),
          path.join(domComponentProxyOutputDir, DOM_COMPONENTS_BUNDLE_DIR)
        )
      : null,

    // NOTE(EvanBacon): This may need to be adjusted in the future if want to support baseUrl on native
    // platforms when doing production embeds (unlikely).
    options.assetsDest
      ? persistMetroAssetsAsync(projectRoot, assets, {
          platform: options.platform,
          outputDirectory: options.assetsDest,
          iosAssetCatalogDirectory: options.assetCatalogDest,
        })
      : null,
  ]);
}

async function dumpDeploymentLogs(projectRoot: string, logs: string, name = 'deploy') {
  const outputPath = path.join(projectRoot, `.expo/logs/${name}.log`);
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  debug('Dumping server deployment logs to: ' + outputPath);
  await fs.promises.writeFile(outputPath, logs);
  return outputPath;
}

function getCommandBin(command: string) {
  try {
    return execSync(`command -v ${command}`, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

async function runServerDeployCommandAsync(
  projectRoot: string,
  {
    distDirectory,
    deployScript,
  }: { distDirectory: string; deployScript: { scriptName: string; script: string } | null }
): Promise<string | false> {
  const logOfflineError = () => {
    const manualScript = deployScript
      ? `npm run ${deployScript.scriptName}`
      : `npx eas deploy --export-dir ${distDirectory}`;

    logMetroErrorInXcode(
      projectRoot,
      chalk.red`Running CLI in offline mode, skipping server deployment. Deploy manually with: ${manualScript}`
    );
  };
  if (env.EXPO_OFFLINE) {
    logOfflineError();
    return false;
  }
  // TODO: Test error cases thoroughly since they run at the end of a build:
  // - EAS not installed.
  // - EAS not configured.
  // - Build from Xcode locally.
  // - Build from Xcode with EAS.
  // - Network error.
  // - Custom deploy script `deploy.native`.

  const globalBin = getCommandBin('eas');

  if (!globalBin) {
    // This should never happen from EAS Builds.
    // Possible to happen when building locally with `npx expo run`
    logMetroErrorInXcode(
      projectRoot,
      `eas-cli is not installed globally, skipping server deployment. Install EAS CLI with 'npm install -g eas-cli'.`
    );
    return false;
  }
  debug('Found eas-cli:', globalBin);

  let json: any;
  try {
    let results: spawnAsync.SpawnResult;

    const spawnOptions: spawnAsync.SpawnOptions = {
      cwd: projectRoot,
      // Ensures that errors can be caught.
      stdio: 'pipe',
    };
    // TODO: Support absolute paths in EAS CLI
    const exportDir = path.relative(projectRoot, distDirectory);
    if (deployScript) {
      logInXcode(`Using custom server deploy script: ${deployScript.scriptName}`);
      // Amend the path to try and make the custom scripts work.

      results = await spawnAsync(
        'npm',
        ['run', deployScript.scriptName, `--export-dir=${exportDir}`],
        spawnOptions
      );
    } else {
      logInXcode('Deploying server to link with client');

      // results = DEPLOYMENT_SUCCESS_FIXTURE;
      results = await spawnAsync(
        'node',
        [globalBin, 'deploy', '--non-interactive', '--json', `--export-dir=${exportDir}`],
        spawnOptions
      );

      debug('Server deployment stdout:', results.stdout);

      // Send stderr to stderr. stdout is parsed as JSON.
      if (results.stderr) {
        process.stderr.write(results.stderr);
      }
    }

    const logPath = await dumpDeploymentLogs(projectRoot, results.output.join('\n'));

    try {
      // {
      //   "dashboardUrl": "https://staging.expo.dev/projects/80ca6300-4db2-459e-8fde-47bad9c532ff/hosting/deployments",
      //   "deployment": {
      //     "identifier": "29bkrcd7ky",
      //     "url": "https://sep23--29bkrcd7ky.staging.expo.app"
      //   }
      // }
      json = JSON.parse(results.stdout.trim());
    } catch {
      logMetroErrorInXcode(
        projectRoot,
        `Failed to parse server deployment JSON output. Check the logs for more information: ${logPath}`
      );
      return false;
    }
  } catch (error) {
    if (isSpawnResultError(error)) {
      const output = error.output.join('\n').trim() || error.toString();
      Log.log(
        chalk.dim(
          'An error occurred while deploying server. Logs stored at: ' +
            (await dumpDeploymentLogs(projectRoot, output, 'deploy-error'))
        )
      );

      // Likely a server offline or network error.
      if (output.match(/ENOTFOUND/)) {
        logOfflineError();
        // Print the raw error message to help provide more context.
        Log.log(chalk.dim(output));
        // Prevent any other network requests (unlikely for this command).
        disableNetwork();
        return false;
      }

      logInXcode(output);
      if (output.match(/spawn eas ENOENT/)) {
        // EAS not installed.
        logMetroErrorInXcode(
          projectRoot,
          `Server deployment failed because eas-cli cannot be accessed from the build script's environment (ENOENT). Install EAS CLI with 'npm install -g eas-cli'.`
        );
        return false;
      }

      if (error.stderr.match(/Must configure EAS project by running/)) {
        // EAS not configured, this can happen when building a project locally before building in EAS.
        // User must run `eas init`, `eas deploy`, or `eas build` first.

        // TODO: Should we fail the build here or just warn users?
        logMetroErrorInXcode(
          projectRoot,
          `Skipping server deployment because EAS is not configured. Run 'eas init' before trying again, or disable server output in the project.`
        );
        return false;
      }
    }

    // Throw unhandled server deployment errors.
    throw error;
  }

  // Assert json format
  assertDeploymentJsonOutput(json);

  // Warn about the URL not being valid. This should never happen, but might be possible with third-parties.
  if (!URL.canParse(json.deployment.url)) {
    warnInXcode(`The server deployment URL is not a valid URL: ${json.deployment.url}`);
  }

  logInXcode(`Server deployed to: ${json.deployment.url}`);

  return json.deployment.url;
}

type ServerDeploymentResults = {
  deployment: {
    url: string;
  };
};

function assertDeploymentJsonOutput(json: any): asserts json is ServerDeploymentResults {
  if (
    !json ||
    typeof json !== 'object' ||
    typeof json.deployment !== 'object' ||
    typeof json.deployment.url !== 'string'
  ) {
    throw new Error(
      'JSON output of server deployment command are not in the expected format: { deployment: { url: "https://..." } }'
    );
  }
}

function getServerDeploymentScript(
  scripts: Record<string, string> | undefined,
  platform: string
): { scriptName: string; script: string } | null {
  // Users can overwrite the default deployment script with:
  // { scripts: { "native:deploy": "eas deploy --json --non-interactive" } }
  // { scripts: { "native:deploy:ios": "eas deploy" } }
  // A quick search on GitHub showed that `native:deploy` is not used in any public repos yet.
  // https://github.com/search?q=%22native%3Adeploy%22+path%3Apackage.json&type=code
  const DEFAULT_SCRIPT_NAME = 'native:deploy';

  const scriptNames = [DEFAULT_SCRIPT_NAME + ':' + platform, DEFAULT_SCRIPT_NAME];

  for (const scriptName of scriptNames) {
    if (scripts?.[scriptName]) {
      return { scriptName, script: scripts[scriptName] };
    }
  }

  return null;
}

async function exportStandaloneServerAsync(
  projectRoot: string,
  devServer: MetroBundlerDevServer,
  {
    exp,
    pkg,
    files,
    options,
  }: { exp: ExpoConfig; pkg: PackageJSONConfig; files: ExportAssetMap; options: Options }
) {
  if (!options.eager) {
    await tryRemovingGeneratedOriginAsync(projectRoot, exp);
  }

  logInXcode('Exporting server');

  // Store the server output in the project's .expo directory.
  const serverOutput = path.join(projectRoot, '.expo/server', options.platform);

  // Remove the previous server output to prevent stale files.
  await removeAsync(serverOutput);

  // Export the API routes for server rendering the React Server Components.
  await exportApiRoutesStandaloneAsync(devServer, {
    files,
    platform: 'web',
  });

  const publicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);

  // Copy over public folder items
  await copyPublicFolderAsync(publicPath, serverOutput);

  // Copy over the server output on top of the public folder.
  await persistMetroFilesAsync(files, serverOutput);

  // TODO: This is required for eas cli to detect that the project is dynamic. We need to fix upstream.
  await fs.promises.mkdir(path.join(serverOutput, 'client'), { recursive: true });

  [...files.entries()].forEach(([key, value]) => {
    if (value.targetDomain === 'server') {
      // Delete server resources to prevent them from being exposed in the binary.
      files.delete(key);
    }
  });

  // TODO: Deprecate this in favor of a built-in prop that users should avoid setting.
  const userDefinedServerUrl = exp.extra?.router?.origin;
  let serverUrl = userDefinedServerUrl;

  const shouldSkipServerDeployment = (() => {
    if (!options.eager) {
      logInXcode('Skipping server deployment because the script is not running in eager mode.');
      return true;
    }

    // Add an opaque flag to disable server deployment.
    if (env.EXPO_NO_DEPLOY) {
      warnInXcode('Skipping server deployment because environment variable EXPO_NO_DEPLOY is set.');
      return true;
    }

    // Can't safely deploy from Xcode since the PATH isn't set up correctly. We could amend this in the future and allow users who customize the PATH to deploy from Xcode.
    if (isExecutingFromXcodebuild()) {
      // TODO: Don't warn when the eager bundle has been run.
      warnInXcode(
        'Skipping server deployment because the build is running from an Xcode run script. Build with Expo CLI or EAS Build to deploy the server automatically.'
      );
      return true;
    }

    return false;
  })();

  // Deploy the server output to a hosting provider.
  const deployedServerUrl = shouldSkipServerDeployment
    ? false
    : await runServerDeployCommandAsync(projectRoot, {
        distDirectory: serverOutput,
        deployScript: getServerDeploymentScript(pkg.scripts, options.platform),
      });

  if (!deployedServerUrl) {
    Log.log(
      `Skipping writing generated server URL (${deployedServerUrl}) to app.json because a value is already defined.`
    );
    return;
  }

  if (serverUrl) {
    logInXcode(
      `Using custom server URL: ${serverUrl} (ignoring deployment URL: ${deployedServerUrl})`
    );
  }

  // If the user-defined server URL is not defined, use the deployed server URL.
  // This allows for overwriting the server URL in the project's native files.
  serverUrl ||= deployedServerUrl;

  // If the user hasn't manually defined the server URL, write the deployed server URL to the app.json.
  if (userDefinedServerUrl) {
    return;
  }
  Log.log('Writing generated server URL to app.json');

  // NOTE: Is is it possible to assert that the config needs to be modifiable before building the app?
  const modification = await modifyConfigAsync(
    projectRoot,
    {
      extra: {
        ...(exp.extra ?? {}),
        router: {
          ...(exp.extra?.router ?? {}),
          generatedOrigin: serverUrl,
        },
      },
    },
    {
      skipSDKVersionRequirement: true,
    }
  );

  if (modification.type !== 'success') {
    throw new CommandError(
      `Failed to write generated server origin to app.json because the file is dynamic and does not extend the static config. The client will not be able to make server requests to API routes or static files. You can disable server linking with EXPO_NO_DEPLOY=1 or by disabling server output in the app.json.`
    );
  }
}

/** We can try to remove the generated origin from the manifest when running outside of eager mode. Bundling is the last operation to run so the config will already be embedded with the origin. */
async function tryRemovingGeneratedOriginAsync(projectRoot: string, exp: ExpoConfig) {
  if (env.CI) {
    // Skip in CI since nothing is committed.
    return;
  }
  if (exp.extra?.router?.generatedOrigin == null) {
    debug('No generated origin needs removing');
    return;
  }

  const modification = await modifyConfigAsync(
    projectRoot,
    {
      extra: {
        ...(exp.extra ?? {}),
        router: {
          ...(exp.extra?.router ?? {}),
          generatedOrigin: undefined,
        },
      },
    },
    {
      skipSDKVersionRequirement: true,
    }
  );

  if (modification.type !== 'success') {
    debug('Could not remove generated origin from manifest');
  } else {
    debug('Generated origin has been removed from manifest');
  }
}

export async function exportEmbedBundleAndAssetsAsync(
  projectRoot: string,
  options: Options
): Promise<{
  bundle: Awaited<ReturnType<Server['build']>>;
  assets: readonly BundleAssetWithFileHashes[];
  files: ExportAssetMap;
}> {
  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, {
    minify: options.minify,
    mode: options.dev ? 'development' : 'production',
    port: 8081,
    isExporting: true,
    location: {},
    resetDevServer: options.resetCache,
    maxWorkers: options.maxWorkers,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const { exp, pkg } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const isHermes = isEnableHermesManaged(exp, options.platform);

  let sourceMapUrl = options.sourcemapOutput;
  if (sourceMapUrl && !options.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const files: ExportAssetMap = new Map();

  try {
    const bundles = await devServer.nativeExportBundleAsync(
      {
        // TODO: Re-enable when we get bytecode chunk splitting working again.
        splitChunks: false, //devServer.isReactServerComponentsEnabled,
        mainModuleName: resolveRealEntryFilePath(projectRoot, options.entryFile),
        platform: options.platform,
        minify: options.minify,
        mode: options.dev ? 'development' : 'production',
        engine: isHermes ? 'hermes' : undefined,
        serializerIncludeMaps: !!sourceMapUrl,
        // Never output bytecode in the exported bundle since that is hardcoded in the native run script.
        bytecode: false,
        // source map inline
        reactCompiler: !!exp.experiments?.reactCompiler,
      },
      files,
      {
        sourceMapUrl,
        unstable_transformProfile: (options.unstableTransformProfile ||
          (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
      }
    );

    const apiRoutesEnabled = exp.web?.output === 'server';

    if (devServer.isReactServerComponentsEnabled || apiRoutesEnabled) {
      await exportStandaloneServerAsync(projectRoot, devServer, {
        exp,
        pkg,
        files,
        options,
      });
    }

    // TODO: Remove duplicates...
    const expoDomComponentReferences = bundles.artifacts
      .map((artifact) =>
        Array.isArray(artifact.metadata.expoDomComponentReferences)
          ? artifact.metadata.expoDomComponentReferences
          : []
      )
      .flat();

    await exportDomComponentsAsync(
      projectRoot,
      expoDomComponentReferences,
      options,
      devServer,
      isHermes,
      sourceMapUrl,
      exp,
      files
    );

    return {
      files,
      bundle: {
        code: bundles.artifacts.filter((a: any) => a.type === 'js')[0].source.toString(),
        // Can be optional when source maps aren't enabled.
        map: bundles.artifacts.filter((a: any) => a.type === 'map')[0]?.source.toString(),
      },
      assets: bundles.assets,
    };
  } catch (error: any) {
    if (isError(error)) {
      // Log using Xcode error format so the errors are picked up by xcodebuild.
      // https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script
      if (options.platform === 'ios') {
        // If the error is about to be presented in Xcode, strip the ansi characters from the message.
        if ('message' in error && isExecutingFromXcodebuild()) {
          error.message = stripAnsi(error.message) as string;
        }
        logMetroErrorInXcode(projectRoot, error);
      }
    }
    throw error;
  } finally {
    devServerManager.stopAsync();
  }
}

// TODO(EvanBacon): Move this to expo export in the future when we determine how to support DOM Components with hosting.
async function exportDomComponentsAsync(
  projectRoot: string,
  expoDomComponentReferences: string[],
  options: Options,
  devServer: MetroBundlerDevServer,
  isHermes: boolean,
  sourceMapUrl: string | undefined,
  exp: ExpoConfig,
  files: ExportAssetMap
) {
  if (!expoDomComponentReferences.length) {
    return;
  }

  const virtualEntry = resolveFrom(projectRoot, 'expo/dom/entry.js');
  await Promise.all(
    // TODO: Make a version of this which uses `this.metro.getBundler().buildGraphForEntries([])` to bundle all the DOM components at once.
    expoDomComponentReferences.map(async (filePath) => {
      debug('Bundle DOM Component:', filePath);
      // MUST MATCH THE BABEL PLUGIN!
      const hash = crypto.createHash('sha1').update(filePath).digest('hex');
      const outputName = `${DOM_COMPONENTS_BUNDLE_DIR}/${hash}.html`;
      const generatedEntryPath = filePath.startsWith('file://') ? filePath.slice(7) : filePath;
      const baseUrl = `/${DOM_COMPONENTS_BUNDLE_DIR}`;
      const relativeImport = './' + path.relative(path.dirname(virtualEntry), generatedEntryPath);
      // Run metro bundler and create the JS bundles/source maps.
      const bundle = await devServer.legacySinglePageExportBundleAsync({
        platform: 'web',
        domRoot: encodeURI(relativeImport),
        splitChunks: !env.EXPO_NO_BUNDLE_SPLITTING,
        mainModuleName: resolveRealEntryFilePath(projectRoot, virtualEntry),
        mode: options.dev ? 'development' : 'production',
        engine: isHermes ? 'hermes' : undefined,
        serializerIncludeMaps: !!sourceMapUrl,
        bytecode: false,
        reactCompiler: !!exp.experiments?.reactCompiler,
        baseUrl: './',
        // Minify may be false because it's skipped on native when Hermes is enabled, default to true.
        minify: true,
      });

      const html = await serializeHtmlWithAssets({
        isExporting: true,
        resources: bundle.artifacts,
        template: getDomComponentHtml(),
        baseUrl: './',
      });

      getFilesFromSerialAssets(
        bundle.artifacts.map((a) => {
          return {
            ...a,
            filename: path.join(baseUrl, a.filename),
          };
        }),
        {
          includeSourceMaps: !!sourceMapUrl,
          files,
          platform: 'web',
        }
      );

      files.set(outputName, {
        contents: html,
      });

      if (options.assetsDest) {
        // Save assets like a typical bundler, preserving the file paths on web.
        // This is saving web-style inside of a native app's binary.
        await persistMetroAssetsAsync(
          projectRoot,
          bundle.assets.map((asset) => ({
            ...asset,
            httpServerLocation: path.join(DOM_COMPONENTS_BUNDLE_DIR, asset.httpServerLocation),
          })),
          {
            files,
            platform: 'web',
            outputDirectory: options.assetsDest,
          }
        );
      }
    })
  );
}

// Exports for expo-updates
export async function createMetroServerAndBundleRequestAsync(
  projectRoot: string,
  options: Pick<
    Options,
    | 'maxWorkers'
    | 'config'
    | 'platform'
    | 'sourcemapOutput'
    | 'sourcemapUseAbsolutePath'
    | 'entryFile'
    | 'minify'
    | 'dev'
    | 'resetCache'
    | 'unstableTransformProfile'
  >
): Promise<{ server: Server; bundleRequest: BundleOptions }> {
  const exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;

  // TODO: This is slow ~40ms
  const { config } = await loadMetroConfigAsync(
    projectRoot,
    {
      // TODO: This is always enabled in the native script and there's no way to disable it.
      resetCache: options.resetCache,

      maxWorkers: options.maxWorkers,
      config: options.config,
    },
    {
      exp,
      isExporting: true,
      getMetroBundler() {
        return server.getBundler().getBundler();
      },
    }
  );

  const isHermes = isEnableHermesManaged(exp, options.platform);

  let sourceMapUrl = options.sourcemapOutput;
  if (sourceMapUrl && !options.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const bundleRequest = {
    ...Server.DEFAULT_BUNDLE_OPTIONS,
    ...getMetroDirectBundleOptionsForExpoConfig(projectRoot, exp, {
      splitChunks: false,
      mainModuleName: resolveRealEntryFilePath(projectRoot, options.entryFile),
      platform: options.platform,
      minify: options.minify,
      mode: options.dev ? 'development' : 'production',
      engine: isHermes ? 'hermes' : undefined,
      isExporting: true,
      // Never output bytecode in the exported bundle since that is hardcoded in the native run script.
      bytecode: false,
    }),
    sourceMapUrl,
    unstable_transformProfile: (options.unstableTransformProfile ||
      (isHermes ? 'hermes-stable' : 'default')) as BundleOptions['unstable_transformProfile'],
  };

  const server = new Server(config, {
    watch: false,
  });

  return { server, bundleRequest };
}

export async function exportEmbedAssetsAsync(
  server: Server,
  bundleRequest: BundleOptions,
  projectRoot: string,
  options: Pick<Options, 'platform'>
) {
  try {
    const { entryFile, onProgress, resolverOptions, transformOptions } = splitBundleOptions({
      ...bundleRequest,
      bundleType: 'todo',
    });

    assertMetroPrivateServer(server);

    const dependencies = await server._bundler.getDependencies(
      [entryFile],
      transformOptions,
      resolverOptions,
      { onProgress, shallow: false, lazy: false }
    );

    const config = server._config;

    return getMetroAssets(dependencies, {
      processModuleFilter: config.serializer.processModuleFilter,
      assetPlugins: config.transformer.assetPlugins,
      platform: transformOptions.platform!,
      // Forked out of Metro because the `this._getServerRootDir()` doesn't match the development
      // behavior.
      projectRoot: config.projectRoot, // this._getServerRootDir(),
      publicPath: config.transformer.publicPath,
    });
  } catch (error: any) {
    if (isError(error)) {
      // Log using Xcode error format so the errors are picked up by xcodebuild.
      // https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Log-errors-and-warnings-from-your-script
      if (options.platform === 'ios') {
        // If the error is about to be presented in Xcode, strip the ansi characters from the message.
        if ('message' in error && isExecutingFromXcodebuild()) {
          error.message = stripAnsi(error.message) as string;
        }
        logMetroErrorInXcode(projectRoot, error);
      }
    }
    throw error;
  }
}

function isError(error: any): error is Error {
  return error instanceof Error;
}

/**
 * This is a workaround for Metro not resolving entry file paths to their real location.
 * When running exports through `eas build --local` on macOS, the `/var/folders` path is used instead of `/private/var/folders`.
 *
 * See: https://github.com/expo/expo/issues/28890
 */
function resolveRealEntryFilePath(projectRoot: string, entryFile: string): string {
  if (projectRoot.startsWith('/private/var') && entryFile.startsWith('/var')) {
    return fs.realpathSync(entryFile);
  }

  return entryFile;
}
