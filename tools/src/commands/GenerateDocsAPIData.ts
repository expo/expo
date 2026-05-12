import { Command } from '@expo/commander';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import recursiveOmitBy from 'recursive-omit-by';
import type { TypeDocOptions } from 'typedoc';

import { EXPO_DIR, PACKAGES_DIR } from '../Constants';
import logger from '../Logger';
import { applyDocsInline, DOCS_INLINE_TAG } from '../generate-docs-api-data/docsInline';

type ActionOptions = {
  packageName?: string;
  sdk?: string;
};

type EntryPoint = string | string[];

type CommandAdditionalParams = [entryPoint: EntryPoint, packageName?: string];

const MINIFY_JSON = true;

const uiPackagesMapping: Record<string, CommandAdditionalParams> = {
  // drop-in replacements
  'expo-ui/community/datetime-picker': ['community/datetime-picker/index.tsx', 'expo-ui'],
  'expo-ui/community/masked-view': ['community/masked-view/index.tsx', 'expo-ui'],
  'expo-ui/community/picker': ['community/picker/index.tsx', 'expo-ui'],
  'expo-ui/community/segmented-control': ['community/segmented-control/index.tsx', 'expo-ui'],
  'expo-ui/community/slider': ['community/slider/index.tsx', 'expo-ui'],

  // Swift UI
  'expo-ui/swift-ui/accessorywidgetbackground': [
    'swift-ui/AccessoryWidgetBackground/index.tsx',
    'expo-ui',
  ],
  'expo-ui/swift-ui/bottomsheet': ['swift-ui/BottomSheet/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/button': ['swift-ui/Button/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/circularprogress': ['swift-ui/ProgressView/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/colorpicker': ['swift-ui/ColorPicker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/confirmationdialog': ['swift-ui/ConfirmationDialog/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/contextmenu': ['swift-ui/ContextMenu/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/controlgroup': ['swift-ui/ControlGroup/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/datepicker': ['swift-ui/DatePicker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/disclosuregroup': ['swift-ui/DisclosureGroup/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/divider': ['swift-ui/Divider/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/form': ['swift-ui/Form/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/gauge': ['swift-ui/Gauge/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/group': ['swift-ui/Group/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/host': ['swift-ui/Host/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/hstack': ['swift-ui/HStack/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/lazyhstack': ['swift-ui/LazyHStack/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/lazyvstack': ['swift-ui/LazyVStack/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/image': ['swift-ui/Image/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/label': ['swift-ui/Label/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/linearprogress': ['swift-ui/ProgressView/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/link': ['swift-ui/Link/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/list': ['swift-ui/List/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/menu': ['swift-ui/Menu/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/modifiers': ['swift-ui/modifiers/index.ts', 'expo-ui'],
  'expo-ui/swift-ui/namespace': ['swift-ui/Namespace.tsx', 'expo-ui'],
  'expo-ui/swift-ui/overlay': ['swift-ui/Overlay/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/picker': ['swift-ui/Picker/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/popover': ['swift-ui/Popover/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/progressview': ['swift-ui/ProgressView/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/rnhostview': ['swift-ui/RNHostView.tsx', 'expo-ui'],
  'expo-ui/swift-ui/scrollview': ['swift-ui/ScrollView/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/section': ['swift-ui/Section/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/securefield': ['swift-ui/SecureField/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/slider': ['swift-ui/Slider/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/spacer': ['swift-ui/Spacer/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/tabview': ['swift-ui/TabView/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/text': ['swift-ui/Text/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/textfield': ['swift-ui/TextField/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/toggle': ['swift-ui/Toggle/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/usenativestate': ['State/useNativeState.ts', 'expo-ui'],
  'expo-ui/swift-ui/vstack': ['swift-ui/VStack/index.tsx', 'expo-ui'],
  'expo-ui/swift-ui/zstack': ['swift-ui/ZStack/index.tsx', 'expo-ui'],

  // Jetpack Compose
  'expo-ui/jetpack-compose/badge': ['jetpack-compose/Badge/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/badgedbox': ['jetpack-compose/BadgedBox/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/alertdialog': ['jetpack-compose/AlertDialog/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/basicalertdialog': [
    'jetpack-compose/BasicAlertDialog/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/bottomsheet': ['jetpack-compose/ModalBottomSheet/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/button': ['jetpack-compose/Button/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/card': ['jetpack-compose/Card/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/carousel': ['jetpack-compose/Carousel/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/chip': ['jetpack-compose/Chip/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/colors': ['jetpack-compose/colors.ts', 'expo-ui'],
  'expo-ui/jetpack-compose/dropdownmenu': ['jetpack-compose/DropdownMenu/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/exposeddropdownmenubox': [
    'jetpack-compose/ExposedDropdownMenuBox/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/datetimepicker': ['jetpack-compose/DatePicker/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/divider': ['jetpack-compose/Divider/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/dockedsearchbar': [
    'jetpack-compose/DockedSearchBar/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/filterchip': ['jetpack-compose/FilterChip/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/floatingactionbutton': [
    'jetpack-compose/FloatingActionButton/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/horizontalfloatingtoolbar': [
    'jetpack-compose/HorizontalFloatingToolbar/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/horizontalpager': [
    'jetpack-compose/HorizontalPager/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/host': ['jetpack-compose/Host/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/icon': ['jetpack-compose/Icon/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/iconbutton': ['jetpack-compose/IconButton/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/box': ['jetpack-compose/Box/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/row': ['jetpack-compose/Row/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/column': ['jetpack-compose/Column/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/flowrow': ['jetpack-compose/FlowRow/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/lazycolumn': ['jetpack-compose/LazyColumn/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/lazyrow': ['jetpack-compose/LazyRow/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/progress': ['jetpack-compose/Progress/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/listitem': ['jetpack-compose/ListItem/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/modifiers': ['jetpack-compose/modifiers/index.ts', 'expo-ui'],
  'expo-ui/jetpack-compose/segmentedbutton': [
    'jetpack-compose/SegmentedButton/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/pulltorefreshbox': [
    'jetpack-compose/PullToRefreshBox/index.tsx',
    'expo-ui',
  ],
  'expo-ui/jetpack-compose/radiobutton': ['jetpack-compose/RadioButton/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/rnhostview': ['jetpack-compose/RNHostView/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/searchbar': ['jetpack-compose/SearchBar/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/shape': ['jetpack-compose/Shape/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/slider': ['jetpack-compose/Slider/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/spacer': ['jetpack-compose/Spacer/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/surface': ['jetpack-compose/Surface/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/checkbox': ['jetpack-compose/Checkbox/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/switch': ['jetpack-compose/Switch/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/text': ['jetpack-compose/Text/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/textfield': ['jetpack-compose/TextField/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/togglebutton': ['jetpack-compose/ToggleButton/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/tooltip': ['jetpack-compose/Tooltip/index.tsx', 'expo-ui'],
  'expo-ui/jetpack-compose/usenativestate': ['State/useNativeState.ts', 'expo-ui'],

  // Universal (cross-platform JS components)
  'expo-ui/universal/host': ['universal/Host/index.tsx', 'expo-ui'],
  'expo-ui/universal/column': ['universal/Column/index.tsx', 'expo-ui'],
  'expo-ui/universal/row': ['universal/Row/index.tsx', 'expo-ui'],
  'expo-ui/universal/text': ['universal/Text/index.tsx', 'expo-ui'],
  'expo-ui/universal/button': ['universal/Button/index.tsx', 'expo-ui'],
  'expo-ui/universal/scrollview': ['universal/ScrollView/index.tsx', 'expo-ui'],
  'expo-ui/universal/switch': ['universal/Switch/index.tsx', 'expo-ui'],
  'expo-ui/universal/slider': ['universal/Slider/index.tsx', 'expo-ui'],
  'expo-ui/universal/checkbox': ['universal/Checkbox/index.tsx', 'expo-ui'],
  'expo-ui/universal/bottomsheet': ['universal/BottomSheet/index.tsx', 'expo-ui'],
  'expo-ui/universal/fieldgroup': ['universal/FieldGroup/index.ts', 'expo-ui'],
  'expo-ui/universal/icon': ['universal/Icon/index.tsx', 'expo-ui'],
  'expo-ui/universal/spacer': ['universal/Spacer/index.tsx', 'expo-ui'],
  'expo-ui/universal/textinput': ['universal/TextInput/index.tsx', 'expo-ui'],
};

const PACKAGES_MAPPING: Record<string, CommandAdditionalParams> = {
  expo: ['Expo.ts'],
  'expo-accelerometer': [['Accelerometer.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-apple-authentication': ['index.ts'],
  'expo-application': ['Application.ts'],
  'expo-audio': ['index.ts'],
  'expo-auth-session': ['index.ts'],
  'expo-asset': [['Asset.ts', 'AssetHooks.ts']],
  'expo-background-fetch': ['BackgroundFetch.ts'],
  'expo-background-task': ['BackgroundTask.ts'],
  'expo-battery': ['Battery.ts'],
  'expo-barometer': [['Barometer.ts', 'DeviceSensor.ts'], 'expo-sensors'],
  'expo-blur': ['index.ts'],
  'expo-blob': ['ExpoBlob.types.ts'],
  'expo-brightness': ['Brightness.ts'],
  'expo-brownfield': ['index.ts'],
  'expo-build-properties': [['withBuildProperties.ts', 'pluginConfig.ts']],
  'expo-calendar': ['Calendar.ts'],
  'expo-calendar-next': ['next/Calendar.ts', 'expo-calendar'],
  'expo-camera': ['index.ts'],
  'expo-cellular': ['Cellular.ts'],
  'expo-checkbox': ['Checkbox.ts'],
  'expo-clipboard': [['Clipboard.ts', 'Clipboard.types.ts']],
  'expo-constants': [['Constants.ts', 'Constants.types.ts']],
  'expo-contacts': ['index.ts'],
  'expo-contacts-next': ['next/index.ts', 'expo-contacts'],
  'expo-crypto': ['Crypto.ts'],
  'expo-dev-client': ['DevClient.ts'],
  'expo-dev-menu': ['DevMenu.ts'],
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
  'expo-router': [['exports.ts', 'html.ts']],
  'expo-router/stack': ['stack/index.ts', 'expo-router'],
  'expo-router/link': ['link/index.ts', 'expo-router'],
  'expo-router/color': ['color/index.ts', 'expo-router'],
  'expo-router/native-tabs': ['native-tabs/index.ts', 'expo-router'],
  'expo-router/split-view': ['split-view/index.ts', 'expo-router'],
  'expo-router/experimental-stack': ['layouts/experimental-stack/index.tsx', 'expo-router'],
  'expo-router/ui': ['ui/index.ts', 'expo-router'],
  'expo-screen-capture': ['ScreenCapture.ts'],
  'expo-screen-orientation': ['ScreenOrientation.ts'],
  'expo-secure-store': ['SecureStore.ts'],
  'expo-server': ['index.ts'],
  'expo-sharing': ['index.ts'],
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
  'expo-video-thumbnails': ['VideoThumbnails.ts'],
  'expo-web-browser': ['WebBrowser.ts'],
  '@expo/fingerprint': ['index.ts'],
  'expo-age-range': ['index.ts'],
  'expo-app-integrity': ['index.ts'],
  'expo-glass-effect': ['index.ts'],
  'expo-widgets': ['index.ts'],
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

  const typedocOptions = {
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
      DOCS_INLINE_TAG,
      '@docsMissing',
      '@header',
      '@hideType',
      '@needsAudit',
      '@platform',
    ],
  } as unknown as TypeDocOptions;

  const app = await Application.bootstrapWithPlugins(typedocOptions, [
    new TSConfigReader(),
    new TypeDocReader(),
  ]);

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

    await applyDocsInline(trimmedOutput, {
      packageSrcDir: entriesPath,
      tsConfigPath,
    });

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
