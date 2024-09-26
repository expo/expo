/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, getConfig } from '@expo/config';
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

import { Options } from './resolveOptions';
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
import { removeAsync } from '../../utils/dir';
import { env } from '../../utils/env';
import { attemptModification } from '../../utils/modifyConfigAsync';
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

// const DEPLOYMENT_SUCCESS_FIXTURE = {
//   pid: 84795,
//   output: [
//     '{\n' +
//       '  "dashboardUrl": "https://staging.expo.dev/projects/80ca6300-4db2-459e-8fde-47bad9c532ff/hosting/deployments",\n' +
//       '  "deployment": {\n' +
//       '    "identifier": "dccw84urit",\n' +
//       '    "url": "https://sep23-issue--dccw84urit.staging.expo.app"\n' +
//       '  }\n' +
//       '}\n',
//     'EAS Worker Deployments are in beta and subject to breaking changes.\n' +
//       '> Project export: server\n' +
//       '- Preparing project\n' +
//       '- Creating deployment\n' +
//       '✔ Created deployment\n',
//   ],
//   stdout:
//     '{\n' +
//     '  "dashboardUrl": "https://staging.expo.dev/projects/80ca6300-4db2-459e-8fde-47bad9c532ff/hosting/deployments",\n' +
//     '  "deployment": {\n' +
//     '    "identifier": "dccw84urit",\n' +
//     '    "url": "https://sep23-issue--dccw84urit.staging.expo.app"\n' +
//     '  }\n' +
//     '}\n',
//   stderr:
//     'EAS Worker Deployments are in beta and subject to breaking changes.\n' +
//     '> Project export: server\n' +
//     '- Preparing project\n' +
//     '- Creating deployment\n' +
//     '✔ Created deployment\n',
//   status: 0,
//   signal: null,
// };
// const DEPLOYMENT_SUCCESS_WITH_INVALID_STATIC_FIXTURE = {
//   pid: 84795,
//   output: [
//     '{\n' +
//       '  "dashboardUrl": "https://staging.expo.dev/projects/80ca6300-4db2-459e-8fde-47bad9c532ff/hosting/deployments",\n' +
//       '  "deployment": {\n' +
//       '    "identifier": "dccw84urit",\n' +
//       '    "url": "https://sep23-issue--dccw84urit.staging.expo.app"\n' +
//       '  }\n' +
//       '}\n',
//     'EAS Worker Deployments are in beta and subject to breaking changes.\n' +
//       '> Project export: server\n' +
//       '- Preparing project\n' +
//       '- Creating deployment\n' +
//       '✔ Created deployment\n',
//   ],
//   stdout:
//     '{\n' +
//     '  "dashboardUrl": "https://staging.expo.dev/projects/80ca6300-4db2-459e-8fde-47bad9c532ff/hosting/deployments",\n' +
//     '  "deployment": {\n' +
//     '    "identifier": "dccw84urit",\n' +
//     '    "url": "https://sep23-issue--dccw84urit.staging.expo.app"\n' +
//     '  }\n' +
//     '}\n',
//   stderr:
//     'EAS Worker Deployments are in beta and subject to breaking changes.\n' +
//     '> Project export: server\n' +
//     '- Preparing project\n' +
//     '- Creating deployment\n' +
//     '✔ Created deployment\n',
//   status: 0,
//   signal: null,
// };

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

// Detect running in XCode
// https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build#Access-script-related-files-from-environment-variables
const isRunningFromXcodeBuildScript = !!(
  process.env.BUILT_PRODUCTS_DIR &&
  process.env.SCRIPT_INPUT_FILE_COUNT &&
  process.env.SCRIPT_INPUT_FILE_LIST_COUNT &&
  process.env.SCRIPT_OUTPUT_FILE_COUNT
);

function getNodeBinary() {
  if (isRunningFromXcodeBuildScript) {
    if (!process.env.NODE_BINARY) {
      throw new Error(
        'Environment variable NODE_BINARY is not defined. It must be set to the path of the Node.js binary when building from Xcode.'
      );
    }
    return process.env.NODE_BINARY;
  }
  return 'node';
}

async function runServerDeployCommandAsync(
  projectRoot: string,
  {
    distDirectory,
    deployScript,
  }: { distDirectory: string; deployScript: { scriptName: string; script: string } | null }
): Promise<string | false> {
  const nodeBin = getNodeBinary();

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

  let json: any;
  try {
    let results: spawnAsync.SpawnResult;

    const spawnOptions: spawnAsync.SpawnOptions = {
      cwd: projectRoot,
      // Ensures that errors can be caught.
      stdio: 'pipe',
      env: {
        // TODO: NO MERGE
        EXPO_STAGING: '1',
        ...process.env,
      },
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
      logInXcode('Deploying server to EAS');

      // results = DEPLOYMENT_SUCCESS_FIXTURE;
      results = await spawnAsync(
        nodeBin,
        [globalBin, 'deploy', '--non-interactive', '--json', `--export-dir=${exportDir}`],
        spawnOptions
      );
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
    console.log(error);
    // TODO: Account for EAS not being installed.

    if (isSpawnResultError(error)) {
      const output = error.output.join('\n').trim() || error.toString();
      await dumpDeploymentLogs(projectRoot, output, 'deploy-error');

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
      let serverUrl = exp?.extra?.router?.origin;

      const shouldSkipServerDeployment = (() => {
        // Add an opaque flag to disable server deployment.
        if (env.EXPO_NO_DEPLOY) {
          warnInXcode(
            'Skipping server deployment because environment variable EXPO_NO_DEPLOY is set.'
          );
          return true;
        }

        // Can't safely deploy from Xcode since the PATH isn't set up correctly. We could amend this in the future and allow users who customize the PATH to deploy from Xcode.
        if (isRunningFromXcodeBuildScript) {
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

      if (serverUrl) {
        logInXcode(`Using custom server URL: ${serverUrl}`);
        if (deployedServerUrl) {
          logInXcode(`Ignoring deployment URL: ${deployedServerUrl}`);
        }
      }

      // If the user-defined server URL is not defined, use the deployed server URL.
      // This allows for overwriting the server URL in the project's native files.
      serverUrl ||= deployedServerUrl;

      // If the user hasn't manually defined the server URL, write the deployed server URL to the app.json.
      if (!exp.extra?.router?.origin) {
        try {
          // NOTE: Is is it possible to assert that the config needs to be modifiable before building the app?
          await attemptModification(
            projectRoot,
            {
              ...exp,
              extra: {
                ...(exp.extra ?? {}),
                router: {
                  ...(exp.extra?.router ?? {}),
                  generatedOrigin: serverUrl,
                },
              },
            },

            // TODO: This modification warning doesn't make any sense since the user shouldn't be adding the generated origin manually.
            {
              extra: {
                router: {
                  generatedOrigin: serverUrl,
                },
              },
            }
          );
        } catch (error) {
          throw new Error(`Failed to write server origin to app.json: ${error.message}`);
        }
      }

      // TODO: Write to app.json serverOrigin field. Skip when eager bundle was already made.
      if (serverUrl) {
        logInXcode(`Setting server origin: ${serverUrl}`);
        // Write the server URL to the project's native files.
        files.set(
          // The filename will be read by expo/fetch and used to polyfill relative network requests in production.
          options.platform === 'ios'
            ? 'server-origin.txt'
            : // TODO: Where does this go on Android?
              '???',
          {
            contents: serverUrl,
          }
        );
      }
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
