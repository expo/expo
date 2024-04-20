import {
  AndroidConfig,
  withProjectBuildGradle,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
} from '@expo/config-plugins';
import {
  createGeneratedHeaderComment,
  MergeResults,
  removeGeneratedContents,
} from '@expo/config-plugins/build/utils/generateCode';

const pkg = require('expo-camera/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

// Because we need the package to be added AFTER the React and Google maven packages, we create a new allprojects.
// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing
// the existing block to find the correct place to insert our camera maven.
const gradleMaven = [
  `def expoCameraMavenPath = new File(["node", "--print", "require.resolve('expo-camera/package.json')"].execute(null, rootDir).text.trim(), "../android/maven")`,
  `allprojects { repositories { maven { url(expoCameraMavenPath) } } }`,
].join('\n');

const withAndroidCameraGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addCameraImport(config.modResults.contents).contents;
    } else {
      throw new Error('Cannot add camera maven gradle because the build.gradle is not groovy');
    }
    return config;
  });
};

export function addCameraImport(src: string): MergeResults {
  return appendContents({
    tag: 'expo-camera-import',
    src,
    newSrc: gradleMaven,
    comment: '//',
  });
}

// Fork of config-plugins mergeContents, but appends the contents to the end of the file.
function appendContents({
  src,
  newSrc,
  tag,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  comment: string;
}): MergeResults {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [
      // @something
      header,
      // contents
      newSrc,
      // @end
      `${comment} @generated end ${tag}`,
    ].join('\n');

    return {
      contents: sanitizedTarget ?? src + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

const withCamera: ConfigPlugin<
  {
    cameraPermission?: string | false;
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
  } | void
> = (config, { cameraPermission, microphonePermission, recordAudioAndroid = true } = {}) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSCameraUsageDescription: CAMERA_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  config = AndroidConfig.Permissions.withPermissions(
    config,
    [
      'android.permission.CAMERA',
      // Optional
      recordAudioAndroid && 'android.permission.RECORD_AUDIO',
    ].filter(Boolean) as string[]
  );

  return withAndroidCameraGradle(config);
};

export default createRunOncePlugin(withCamera, pkg.name, pkg.version);
