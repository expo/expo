import type { ExpoConfig } from 'expo/config';
import { ConfigPlugin, WarningAggregator, createRunOncePlugin } from 'expo/config-plugins';
import path from 'path';

const pkg = require('../../package.json');

export type Props = {
  /**
   * The watched directory containing app-target App Intents Swift files.
   * @default 'app-intents'
   */
  directory?: string;
};

const DEFAULT_DIRECTORY = 'app-intents';

/**
 * The directories `expo-router` treats as the routes directory. It looks for `app/` at the project
 * root and, when that is missing, for `src/app/`, so both collide with intents placed inside them.
 */
const ROUTER_APP_DIRECTORIES = ['app', 'src/app'];

type ValidationConfig = Pick<ExpoConfig, 'experiments' | '_internal'>;

/**
 * Returns the directory that relative entries are resolved against.
 *
 * `expo-modules-autolinking` resolves every watched entry against the app root, so this plugin has
 * to use the same base. `process.cwd()` is only the app root when the config happens to be read
 * from there, which is not true for a monorepo build or an `npx expo config` run from elsewhere.
 * `_internal.projectRoot` is filled in by the config loader; it is absent when a plain config
 * object is passed straight to this plugin, and then the working directory is the best base left.
 */
function projectRootOf(config: Pick<ExpoConfig, '_internal'>): string {
  return (config._internal?.projectRoot as string | undefined) ?? process.cwd();
}

/**
 * Returns whether `directory` is `ancestor` itself or a directory nested inside it.
 *
 * Both sides are resolved first, so `'./app-intents'`, `'app-intents/'` and
 * `'app-intents/../app-intents'` all name the same directory. The result is then compared by path
 * segment: string comparison gets this wrong in both directions, because `'app-intents-extra'`
 * shares a prefix with `'app-intents'` without being nested inside it, while `'native/..intents'`
 * is nested inside `'native'` even though its relative path starts with two dots.
 */
function isSameOrInside(ancestor: string, directory: string, projectRoot: string): boolean {
  const relativePath = path.relative(
    path.resolve(projectRoot, ancestor),
    path.resolve(projectRoot, directory)
  );

  if (relativePath === '') {
    return true;
  }
  if (path.isAbsolute(relativePath)) {
    return false;
  }
  // Only a whole `..` segment leaves `ancestor`. A segment such as `'..intents'` is an ordinary
  // directory whose name begins with two dots.
  return !relativePath.split(path.sep).includes('..');
}

/**
 * Returns whether inline modules scan `directory`.
 *
 * `expo-modules-autolinking` scans every watched entry recursively, so any ancestor of the intents
 * directory is a working configuration.
 */
function isWatchedDirectory(
  watchedDirectories: string[],
  directory: string,
  projectRoot: string
): boolean {
  return watchedDirectories.some((watchedDirectory) =>
    isSameOrInside(watchedDirectory, directory, projectRoot)
  );
}

/**
 * Returns whether the project builds for iOS.
 *
 * App Intents exist only on iOS, and every JavaScript function in this module deliberately
 * degrades to a no-op elsewhere, so an Android-only or web-only project must not fail to resolve
 * its config over an iOS build step it never runs. `platforms` is optional; when it is missing the
 * target platforms are unknown, so iOS is assumed and the check still runs.
 */
function buildsForIOS(config: Pick<ExpoConfig, 'platforms'>): boolean {
  return config.platforms == null || config.platforms.includes('ios');
}

export function withAppIntentsValidation<T extends ValidationConfig>(
  config: T,
  props: { directory: string }
): T {
  const watchedDirectories = config.experiments?.inlineModules?.watchedDirectories;
  const projectRoot = projectRootOf(config);

  if (
    !watchedDirectories ||
    !isWatchedDirectory(watchedDirectories, props.directory, projectRoot)
  ) {
    const watchedList = watchedDirectories?.length
      ? watchedDirectories.map((directory) => `'${directory}'`).join(', ')
      : 'nothing';

    throw new Error(
      `expo-app-intents cannot build the App Intents in '${props.directory}'. Apple's build-time ` +
        `metadata extraction cannot see code inside pods, so those Swift files have to be ` +
        `compiled into the iOS app target itself. Expo Inline Modules does that, but it only ` +
        `scans the directories listed in expo.experiments.inlineModules.watchedDirectories, ` +
        `which currently covers ${watchedList}.\n\n` +
        `Add the directory to your app config and re-run prebuild:\n\n` +
        `  "experiments": { "inlineModules": { "watchedDirectories": ["${props.directory}"] } }\n\n` +
        `Watched directories are scanned recursively, so a parent directory works too. If your ` +
        `intents already live in a directory that is watched, point the plugin at it instead with ` +
        `the "directory" prop:\n\n` +
        `  ["expo-app-intents", { "directory": "your-watched-directory" }]\n\n` +
        `Or run \`npx expo-app-intents init\` to configure everything automatically.`
    );
  }
  return config;
}

const withAppIntents: ConfigPlugin<Props | void> = (config, props) => {
  // Nothing here applies off iOS, and warning or throwing would only obstruct a build that never
  // compiles an App Intent.
  if (!buildsForIOS(config)) {
    return config;
  }

  const directory = props?.directory ?? DEFAULT_DIRECTORY;

  // Normalised the same way as the watched-directory check, so `'./app/intents'` is recognised.
  const projectRoot = projectRootOf(config);
  const routerDirectory = ROUTER_APP_DIRECTORIES.find((routesDirectory) =>
    isSameOrInside(routesDirectory, directory, projectRoot)
  );
  if (routerDirectory) {
    WarningAggregator.addWarningIOS(
      'expo-app-intents',
      `The configured intents directory '${directory}' is inside '${routerDirectory}/', which ` +
        `expo-router treats as the routes directory. Use a top-level 'app-intents/' directory ` +
        `instead.`
    );
  }

  return withAppIntentsValidation(config, { directory });
};

export default createRunOncePlugin(withAppIntents, pkg.name, pkg.version);
