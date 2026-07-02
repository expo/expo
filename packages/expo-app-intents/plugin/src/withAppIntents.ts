import { ConfigPlugin, WarningAggregator, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');

export type Props = {
  /**
   * The watched directory containing app-target App Intents Swift files.
   * @default 'app-intents'
   */
  directory?: string;
};

const DEFAULT_DIRECTORY = 'app-intents';

export function withAppIntentsValidation<T extends { experiments?: any }>(
  config: T,
  props: { directory: string }
): T {
  const watched: string[] | undefined = config.experiments?.inlineModules?.watchedDirectories;

  if (!watched || !watched.includes(props.directory)) {
    throw new Error(
      `expo-app-intents requires Expo Inline Modules to be enabled so that App Intents Swift files ` +
        `are compiled into the iOS app target (Apple's build-time metadata extraction cannot see ` +
        `code in pods). Configure expo.experiments.inlineModules in your app config and re-run prebuild:\n\n` +
        `  "experiments": { "inlineModules": { "watchedDirectories": ["${props.directory}"] } }\n\n` +
        `Or run \`npx expo-app-intents init\` to configure everything automatically.`
    );
  }
  return config;
}

const withAppIntents: ConfigPlugin<Props | void> = (config, props) => {
  const directory = props?.directory ?? DEFAULT_DIRECTORY;

  if (directory === 'app' || directory.startsWith('app/')) {
    WarningAggregator.addWarningIOS(
      'expo-app-intents',
      `The configured intents directory '${directory}' is inside 'app/', which expo-router treats ` +
        `as the routes directory. Use a top-level 'app-intents/' directory instead.`
    );
  }

  return withAppIntentsValidation(config, { directory });
};

export default createRunOncePlugin(withAppIntents, pkg.name, pkg.version);
