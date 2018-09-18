'use strict';

const gulp = require('gulp');
const { resolve } = require('path');
const shell = require('gulp-shell');
const argv = require('minimist')(process.argv.slice(2));
const { Modules } = require('xdl');

const { saveKernelBundlesAsync } = require('./bundle-tasks');
const { renameJNILibsAsync, updateExpoViewAsync } = require('./android-tasks');
const {
  addVersionAsync,
  removeVersionAsync,
  versionReactNativeIOSFilesAsync,
} = require('./ios-tasks');
const updateVendoredNativeModule = require('./update-vendored-native-module');
const AndroidExpolib = require('./android-versioning/android-expolib');
const androidVersionLibraries = require('./android-versioning/android-version-libraries');

function updateExpoViewWithArguments() {
  if (!argv.abi) {
    throw new Error('Run with `--abi <abi version>`');
  }
  return updateExpoViewAsync(argv.abi);
}

function renameJNILibsWithABIArgument() {
  if (!argv.abi) {
    throw new Error('Must run with `--abi ABI_VERSION`');
  }

  return renameJNILibsAsync(argv.abi);
}

function addVersionWithArguments() {
  if (!argv.abi || !argv.root) {
    throw new Error('Run with `--abi <abi version> --root <path to exponent project root>`');
  }
  return addVersionAsync(argv.abi, argv.root);
}

function removeVersionWithArguments() {
  if (!argv.abi || !argv.root) {
    throw new Error('Run with `--abi <abi version> --root <path to exponent project root>`');
  }
  return removeVersionAsync(argv.abi, argv.root);
}

function versionIOSFilesWithArguments() {
  if (!argv.abi || !argv.filenames) {
    throw new Error('Run with --filenames=<glob pattern> --abi=<abi version>');
  }
  return versionReactNativeIOSFilesAsync(argv.filenames, argv.abi);
}

function runShellScriptWithABIArgument(script) {
  return gulp.series('assert-abi-argument', shell.task([`${script} ${argv.abi}`]));
}

gulp.task('assert-abi-argument', function(done) {
  if (!argv.abi) {
    throw new Error('Must run with `--abi ABI_VERSION`');
  }

  done();
});

gulp.task('assert-lib_name-argument', function(done) {
  if (!argv.lib_name) {
    throw new Error('Must run with `--lib_name expo-module-name`');
  }

  done();
});

function runShellScriptForUniversalModule(script) {
  return gulp.series(
    'assert-abi-argument',
    'assert-lib_name-argument',
    shell.task([`${script} ${argv.abi}`])
  );
}

gulp.task(
  'android-update-rn',
  gulp.series(
    shell.task(['pushd ../android; ./gradlew :tools:execute; popd']),
    gulp.parallel(
      AndroidExpolib.namespaceExpolibImportsAsync,
      AndroidExpolib.namespaceExpolibGradleDependenciesAsync
    )
  )
);

// Versioning (android)
gulp.task(
  'android-update-versioned-rn',
  shell.task([
    'rm -rf ../android/versioned-react-native/{ReactAndroid,ReactCommon}',
    'cp -r ../android/ReactCommon ../android/versioned-react-native/ReactCommon',
    'cp -r ../android/ReactAndroid ../android/versioned-react-native/ReactAndroid',
  ])
);
gulp.task('android-rename-jni-libs', renameJNILibsWithABIArgument);
gulp.task('android-build-aar', runShellScriptWithABIArgument('./android-build-aar.sh'));
gulp.task(
  'android-copy-native-modules',
  runShellScriptWithABIArgument('./android-copy-native-modules.sh')
);
gulp.task(
  'android-build-universal-module-aar',
  runShellScriptForUniversalModule('./android-build-module-aar.sh')
);
gulp.task(
  'android-build-universal-modules',
  gulp.series([
    'assert-abi-argument',
    ...Modules.getVersionableModulesForPlatform('android')
      .map(({ libName }) =>
        gulp.series(
          'assert-abi-argument',
          shell.task([`./android-build-module-aar.sh ${libName} ${argv.abi}`])
        )
      ),
  ])
);
gulp.task('update-exponent-view', updateExpoViewWithArguments);
gulp.task(
  'android-add-rn-version',
  gulp.series(
    'android-update-versioned-rn',
    'android-rename-jni-libs',
    'android-build-aar',
    'android-build-universal-modules',
    'android-copy-native-modules'
  )
);

// Versioning (ios)
gulp.task('ios-add-version', addVersionWithArguments);
gulp.task('ios-remove-version', removeVersionWithArguments);
gulp.task('ios-version-files', versionIOSFilesWithArguments);

// Update external dependencies
gulp.task('update-react-native-svg', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-svg',
    repoUrl: 'https://github.com/expo/react-native-svg.git',
    sourceIosPath: 'ios',
    targetIosPath: 'Api/Components/Svg',
    sourceAndroidPath: 'android/src/main/java/com/horcrux/svg',
    targetAndroidPath: 'modules/api/components/svg',
    sourceAndroidPackage: 'com.horcrux.svg',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.svg',
  });
});

gulp.task('update-react-native-gesture-handler', () => {
  console.log(
    'If you are updating Android, then also run update-react-native-gesture-handler-lib afterwards'
  );
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-gesture-handler',
    repoUrl: 'https://github.com/expo/react-native-gesture-handler.git',
    sourceIosPath: 'ios',
    sourceAndroidPath: 'android/src/main/java/com/swmansion/gesturehandler/react',
    targetIosPath: 'Api/Components/GestureHandler',
    targetAndroidPath: 'modules/api/components/gesturehandler/react',
    sourceAndroidPackage: 'com.swmansion.gesturehandler.react',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler.react',
  });
});

gulp.task('update-react-native-gesture-handler-lib', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-gesture-handler',
    repoUrl: 'https://github.com/expo/react-native-gesture-handler.git',
    sourceIosPath: 'ios',
    targetIosPath: '',
    sourceAndroidPath: 'android/lib/src/main/java/com/swmansion/gesturehandler',
    targetAndroidPath: 'modules/api/components/gesturehandler',
    sourceAndroidPackage: 'com.swmansion.gesturehandler',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
    skipCleanup: true,
  });
});

gulp.task('update-amazon-cognito-identity-js', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'amazon-cognito-identity-js',
    repoUrl: 'https://github.com/aws/amazon-cognito-identity-js.git',
    sourceIosPath: 'ios',
    sourceAndroidPath: 'android/src/main/java/com/amazonaws',
    targetIosPath: 'Api/Cognito',
    targetAndroidPath: 'modules/api/cognito',
    sourceAndroidPackage: 'com.amazonaws',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.cognito',
  });
});

gulp.task('update-react-native-maps', async () => {
  if (argv.ios || argv.allPlatforms) {
    await updateVendoredNativeModule({
      argv,
      name: 'react-native-google-maps',
      repoUrl: 'https://github.com/expo/react-native-maps.git',
      sourceIosPath: 'lib/ios/AirGoogleMaps',
      targetIosPath: 'Api/Components/GoogleMaps',
      sourceAndroidPath: '',
      targetAndroidPath: '',
      sourceAndroidPackage: '',
      targetAndroidPackage: '',
    });
  }
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-maps',
    repoUrl: 'https://github.com/expo/react-native-maps.git',
    sourceIosPath: 'lib/ios/AirMaps',
    sourceAndroidPath: 'lib/android/src/main/java/com/airbnb/android/react/maps',
    targetIosPath: 'Api/Components/Maps',
    targetAndroidPath: 'modules/api/components/maps',
    sourceAndroidPackage: 'com.airbnb.android.react.maps',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maps',
  });
});

gulp.task('update-tipsi-stripe', () => {
  throw new Error('Not working yet, need to update updateVendoredNativeModule to support Optional');
  return updateVendoredNativeModule({
    argv,
    name: 'react-tipsi-stripe',
    repoUrl: 'https://github.com/jeff-da/tipsi-stripe',
    sourceIosPath: 'ios',
    targetIosPath: 'Api/Components/tipsi',
    sourceAndroidPath: 'android/src/main/java/com/gettipsi/',
    targetAndroidPath: 'modules/api/components/tipsi',
    sourceAndroidPackage: 'com.gettipsi.stripe.StripeReactPackage',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.tipsi',
  });
});

gulp.task('update-react-native-admob', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-admob',
    repoUrl: 'https://github.com/expo/react-native-admob',
    sourceIosPath: 'ios',
    targetIosPath: 'Api/Components/admob',
    sourceAndroidPath: 'android/src/main/java/com/sbugert/rnadmob/',
    targetAndroidPath: 'modules/api/components/admob',
    sourceAndroidPackage: 'com.sbugert.rnadmob',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.admob',
  });
});

gulp.task('update-react-native-view-shot', () => {
  console.warn('Heads up, iOS uses EX- instead of RN- symbol prefix');
  return updateVendoredNativeModule({
    argv,
    skipCleanup: true,
    name: 'react-native-view-shot',
    repoUrl: 'https://github.com/gre/react-native-view-shot.git',
    sourceIosPath: 'ios',
    sourceAndroidPath: 'android/src/main/java/fr/greweb/reactnativeviewshot',
    targetIosPath: 'Api',
    targetAndroidPath: 'modules/api',
    sourceAndroidPackage: 'fr.greweb.reactnativeviewshot',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.viewshot',
  });
});

gulp.task('update-react-native-lottie', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-lottie',
    repoUrl: 'https://github.com/expo/lottie-react-native.git',
    sourceIosPath: 'src/ios/LottieReactNative',
    iosPrefix: 'LRN',
    sourceAndroidPath:
      'src/android/src/main/java/com/airbnb/android/react/lottie',
    targetIosPath: 'Api/Components/Lottie',
    targetAndroidPath: 'modules/api/components/lottie',
    sourceAndroidPackage: 'com.airbnb.android.react.lottie',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.lottie',
  });
});

gulp.task('update-react-native-fbads', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-fbads',
    repoUrl: 'https://github.com/callstack-io/react-native-fbads.git',
    sourceIosPath: 'src/ios',
    targetIosPath: 'Api/FBAds',
    sourceAndroidPath: 'src/android/src/main/java/io/callstack/react/fbads',
    targetAndroidPath: 'modules/api/fbads',
    sourceAndroidPackage: 'io.callstack.react.fbads',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.fbads',
  });
});

gulp.task('update-react-native-branch', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-branch',
    repoUrl: 'https://github.com/BranchMetrics/react-native-branch-deep-linking.git',
    sourceIosPath: 'ios',
    targetIosPath: 'Api/Standalone/Branch',
    sourceAndroidPath: 'android/src/main/java/io/branch/rnbranch',
    targetAndroidPath: 'modules/api/standalone/branch',
    sourceAndroidPackage: 'io.branch.rnbranch',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.standalone.branch',
    recursive: false,
  });
});

gulp.task('update-react-native-reanimated', () => {
  console.warn('NOTE: any files in com.facebook.react will not be updated -- you\'ll need to add these to ReactAndroid manually!')
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-reanimated',
    repoUrl: 'https://github.com/kmagiera/react-native-reanimated.git',
    sourceIosPath: 'ios',
    sourceAndroidPath: 'android/src/main/java/com/swmansion/reanimated',
    targetIosPath: 'Api/Reanimated',
    targetAndroidPath: 'modules/api/reanimated',
    sourceAndroidPackage: 'com.swmansion.reanimated',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.reanimated',
  });
});

gulp.task('update-react-native-screens', () => {
  return updateVendoredNativeModule({
    argv,
    name: 'react-native-screens',
    repoUrl: 'https://github.com/kmagiera/react-native-screens.git',
    sourceIosPath: 'ios',
    sourceAndroidPath: 'android/src/main/java/com/swmansion/rnscreens',
    targetIosPath: 'Api/Screens',
    targetAndroidPath: 'modules/api/screens',
    sourceAndroidPackage: 'com.swmansion.rnscreens',
    targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.screens',
  });
});

// Upload kernel bundles
gulp.task('bundle', saveKernelBundlesAsync);
gulp.task('android-jarjar-on-aar', androidVersionLibraries.runJarJarOnAAR);
gulp.task('android-version-libraries', androidVersionLibraries.versionLibrary);

const GENERATE_LIBRARY_WRAPPERS = 'android-generate-library-wrappers';

const versioningArgs = task => {
  const obj = {};
  Object.keys(argv).forEach(k => {
    if (k !== '_') {
      if (k === 'apiLevel') {
        obj[k] = argv[k];
      } else if (k === 'wrapLibraries' || k === 'wrapGroupIds') {
        obj[k] = argv[k].split(',').filter(s => s !== '');
      } else {
        obj[k] = resolve(argv[k]);
      }
    }
  });
  return obj;
};

gulp.task(GENERATE_LIBRARY_WRAPPERS, async () =>
  androidVersionLibraries.generateSharedObjectWrappers(versioningArgs(GENERATE_LIBRARY_WRAPPERS))
);
