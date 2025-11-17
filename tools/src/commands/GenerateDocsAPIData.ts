import { Command } from '@expo/commander';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import recursiveOmitBy from 'recursive-omit-by';

import { EXPO_DIR, PACKAGES_DIR } from '../Constants';
import logger from '../Logger';

type ActionOptions = {
  packageName?: string;
  sdk?: string;
};

type EntryPoint = string | string[];

type CommandAdditionalParams = [entryPoint: EntryPoint, packageName?: string];

const MINIFY_JSON = true;

const uiPackagesMapping: Record<string, CommandAdditionalParams> = {
  'expo-ui/swift-ui/bottomsheet': ['swift-ui/BottomSheet/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/bottomsheet': ['jetpack-compose/BottomSheet/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/button': ['swift-ui/Button/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/button': ['jetpack-compose/Button/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/circularprogress': ['swift-ui/Progress/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/circularprogress': ['jetpack-compose/Progress/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/colorpicker': ['swift-ui/ColorPicker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/contextmenu': ['swift-ui/ContextMenu/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/contextmenu': ['jetpack-compose/ContextMenu/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/datetimepicker': ['swift-ui/DatePicker/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/datetimepicker': ['jetpack-compose/DatePicker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/gauge': ['swift-ui/Gauge/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/host': ['swift-ui/Host/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/host': ['jetpack-compose/Host/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/linearprogress': ['swift-ui/Progress/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/linearprogress': ['jetpack-compose/Progress/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/list': ['swift-ui/List/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/picker': ['swift-ui/Picker/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/picker': ['jetpack-compose/Picker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/slider': ['swift-ui/Slider/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/slider': ['jetpack-compose/Slider/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/switch': ['swift-ui/Switch/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/namespace': ['swift-ui/Namespace.tsx', 'expo-ui'],
  'expo-ui/swift-ui/section': ['swift-ui/Section/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/form': ['swift-ui/Form/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/divider': ['swift-ui/Divider/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/modifiers': ['swift-ui/modifiers/index.ts', 'expo-ui'],
  'expo-ui/jetpack-compose/switch': ['jetpack-compose/Switch/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/textfield': ['swift-ui/TextField/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/textinput': ['jetpack-compose/TextInput/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/chip': ['jetpack-compose/Chip/index.tsx', 'expo-ui'],
};

const PACKAGES_MAPPING: Record<string, CommandAdditionalParams> = {
  expo: ['Expo.ts'],
  'expo-accelerometer': [['Accelerometer.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-apple-authentication': ['index.ts'],
  'expo-application': ['Application.ts'],
  'expo-audio': ['index.ts'],
  'expo-audio-av': [['Audio.ts', 'Audio.types.ts'], 'expo-av'],
  'expo-auth-session': ['index.ts'],
  'expo-av': [['AV.ts', 'AV.types.ts'], 'expo-av'],
  'expo-asset': [['Asset.ts', 'AssetHooks.ts']],
  'expo-background-fetch': ['BackgroundFetch.ts'],
  'expo-background-task': ['BackgroundTask.ts'],
  'expo-battery': ['Battery.ts'],
  'expo-barometer': [['Barometer.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-blur': ['index.ts'],
  'expo-blob': ['ExpoBlob.types.ts'],
  'expo-brightness': ['Brightness.ts'],
  'expo-build-properties': [['withBuildProperties.ts', 'pluginConfig.ts']],
  'expo-calendar': ['Calendar.ts'],
  'expo-calendar-next': ['next/Calendar.ts', 'expo-calendar'],
  'expo-camera': ['index.ts'],
  'expo-cellular': ['Cellular.ts'],
  'expo-checkbox': ['Checkbox.ts'],
  'expo-clipboard': [['Clipboard.ts', 'Clipboard.types.ts']],
  'expo-constants': [['Constants.ts', 'Constants.types.ts']],
  'expo-contacts': ['index.ts'],
  'expo-crypto': ['Crypto.ts'],
  'expo-dev-client': ['DevClient.ts'],
  'expo-device': ['Device.ts'],
  'expo-device-motion': [['DeviceMotion.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-document-picker': ['index.ts'],
  'expo-file-system': ['index.ts'],
  'expo-file-system-legacy': ['legacy/index.ts', 'expo-file-system'],
  'expo-font': ['index.ts'],
  'expo-gl': ['index.ts'],
  'expo-gyroscope': [['Gyroscope.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-haptics': ['Haptics.ts'],
  'expo-image': ['index.ts'],
  'expo-image-manipulator': [['index.ts', 'ImageManipulator.types.ts']],
  'expo-image-picker': ['ImagePicker.ts'],
  'expo-intent-launcher': ['IntentLauncher.ts'],
  'expo-keep-awake': ['index.ts'],
  'expo-light-sensor': [['LightSensor.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-linking': ['Linking.ts'],
  'expo-linear-gradient': ['LinearGradient.tsx'],
  'expo-live-photo': ['index.ts'],
  'expo-local-authentication': ['LocalAuthentication.ts'],
  'expo-localization': ['Localization.ts'],
  'expo-location': ['index.ts'],
  'expo-maps': [
    [
      'index.ts',
      'apple/AppleMapsView.tsx',
      'apple/AppleMaps.types.ts',
      'google/GoogleMapsView.tsx',
      'google/GoogleMaps.types.ts',
      'google/GoogleStreetView.tsx',
    ],
  ],
  'expo-magnetometer': [['Magnetometer.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-manifests': ['Manifests.ts'],
  'expo-mail-composer': ['MailComposer.ts'],
  'expo-media-library': ['MediaLibrary.ts'],
  'expo-media-library-next': ['next/index.ts', 'expo-media-library'],
  'expo-mesh-gradient': ['index.ts'],
  'expo-navigation-bar': ['index.ts'],
  'expo-network': ['Network.ts'],
  'expo-notifications': ['index.ts'],
  'expo-pedometer': ['Pedometer.ts', 'expo-sensors'],
  'expo-print': ['Print.ts'],
  'expo-router': ['exports.ts'],
  'expo-router-ui': ['ui/index.ts', 'expo-router'],
  'expo-router-native-tabs': ['native-tabs/index.ts', 'expo-router'],
  'expo-screen-capture': ['ScreenCapture.ts'],
  'expo-screen-orientation': ['ScreenOrientation.ts'],
  'expo-secure-store': ['SecureStore.ts'],
  'expo-server': ['index.ts'],
  'expo-sharing': ['Sharing.ts'],
  'expo-sms': ['SMS.ts'],
  'expo-speech': ['Speech/Speech.ts'],
  'expo-splash-screen': ['index.ts'],
  'expo-sqlite': [['index.ts', 'Storage.ts'], 'expo-sqlite'],
  'expo-status-bar': ['StatusBar.ts'],
  'expo-store-review': ['StoreReview.ts'],
  'expo-symbols': ['index.ts'],
  'expo-system-ui': ['SystemUI.ts'],
  'expo-task-manager': ['TaskManager.ts'],
  'expo-tracking-transparency': ['TrackingTransparency.ts'],
  'expo-updates': ['index.ts'],
  'expo-video': ['index.ts'],
  'expo-video-av': [['Video.tsx', 'Video.types.ts'], 'expo-av'],
  'expo-video-thumbnails': ['VideoThumbnails.ts'],
  'expo-web-browser': ['WebBrowser.ts'],
  '@expo/fingerprint': ['index.ts'],
  'expo-age-range': ['index.ts'],
  'expo-app-integrity': ['index.ts'],
  'expo-glass-effect': ['index.ts'],
  ...uiPackagesMapping,
};

const executeCommand = async (
  jsonFileName: string,
  sdk?: string,
  entryPoint: EntryPoint = 'index.ts',
  packageName: string = jsonFileName
) => {
  const { Application, Configuration, TSConfigReader, TypeDocReader } = await import('typedoc');

  const dataPath = path.join(
    EXPO_DIR,
    'docs',
    'public',
    'static',
    'data',
    sdk ? `v${sdk}.0.0` : `unversioned`
  );

  if (!fs.existsSync(dataPath)) {
    throw new Error(
      `💥 The path for given SDK version do not exist!
       Check if you have provided the correct major SDK version to the '--sdk' parameter.
       Path: '${dataPath}'`
    );
  }

  const basePath = path.join(PACKAGES_DIR, packageName);
  const entriesPath = path.join(basePath, 'src');
  const tsConfigPath = path.join(basePath, 'tsconfig.json');
  const jsonOutputPath = path.join(dataPath, `${jsonFileName}.json`);

  const entryPoints = Array.isArray(entryPoint)
    ? entryPoint.map((entry) => path.join(entriesPath, entry))
    : [path.join(entriesPath, entryPoint)];

  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints,
      tsconfig: tsConfigPath,
      disableSources: true,
      hideGenerator: true,
      excludePrivate: true,
      excludeProtected: true,
      excludeExternals: true,
      pretty: !MINIFY_JSON,
      commentStyle: 'block',
      jsDocCompatibility: false,
      preserveLinkText: true,
      sourceLinkExternal: false,
      markdownLinkExternal: false,
      blockTags: [
        ...Configuration.OptionDefaults.blockTags,
        '@alias',
        '@deprecated',
        '@docsMissing',
        '@header',
        '@needsAudit',
        '@platform',
      ],
    },
    [new TSConfigReader(), new TypeDocReader()]
  );

  const project = await app.convert();

  if (project) {
    await app.generateJson(project, jsonOutputPath);
    const output = await fs.readJson(jsonOutputPath);
    output.name = jsonFileName;

    if (Array.isArray(entryPoint)) {
      const filterEntries = entryPoint.map((entry) => entry.substring(0, entry.lastIndexOf('.')));
      output.children = output.children
        .filter((entry) => filterEntries.includes(entry.name))
        .map((entry) => entry.children)
        .flat()
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const { readme, symbolIdMap, ...trimmedOutput } = output;

    if (MINIFY_JSON) {
      const minifiedJson = filterOutKeys(filterOutKeys(trimmedOutput));
      await fs.writeFile(jsonOutputPath, JSON.stringify(minifiedJson, null, 0));
    } else {
      await fs.writeFile(jsonOutputPath, JSON.stringify(trimmedOutput));
    }
  } else {
    throw new Error(`💥 Failed to extract API data from source code for '${packageName}' package.`);
  }
};

const KEYS_TO_OMIT = ['id', 'groups', 'kindString', 'originalName', 'files', 'sourceFileName'];

function filterOutKeys(data: Record<string, any>) {
  return recursiveOmitBy(data, ({ key, node }) => {
    return (
      KEYS_TO_OMIT.includes(key) ||
      (key === 'flags' && !Object.keys(node).length) ||
      (key === 'target' && typeof node !== 'object')
    );
  });
}

async function action({ packageName, sdk }: ActionOptions) {
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  try {
    if (packageName) {
      const packagesEntries = Object.entries(PACKAGES_MAPPING)
        .filter(([key, value]) => key === packageName || value.includes(packageName))
        .map(([key, value]) => taskQueue.add(() => executeCommand(key, sdk, ...value)));
      if (packagesEntries.length) {
        await Promise.all(packagesEntries);
        logger.log(
          chalk.green(`\n🎉 Successful extraction of docs API data for the selected package!`)
        );
      } else {
        logger.warn(
          `🚨 Package '${packageName}' API data generation is not supported yet! Add it to the mapping in ${
            __filename
          }.`
        );
      }
    } else {
      const packagesEntries = Object.entries(PACKAGES_MAPPING).map(([key, value]) =>
        taskQueue.add(() => executeCommand(key, sdk, ...value))
      );
      await Promise.all(packagesEntries);
      logger.log(
        chalk.green(`\n🎉 Successful extraction of docs API data for all available packages!`)
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

export default (program: Command) => {
  program
    .command('generate-docs-api-data')
    .alias('gdad')
    .description(`Extract API data JSON files for docs using TypeDoc.`)
    .option('-p, --packageName <packageName>', 'Extract API data only for the specific package.')
    .option('-s, --sdk <version>', 'Set the data output path to the specific SDK version.')
    .asyncAction(action);
};
