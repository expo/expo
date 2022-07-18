import { FileTransforms, StringTransform } from '../../../Transforms.types';

export function vendoredModulesTransforms(prefix: string): Record<string, FileTransforms> {
  return {
    '@shopify/react-native-skia': {
      content: [
        {
          paths: 'build.gradle',
          find: `def nodeModules = Paths.get(projectDir.getPath(), '../../../../../..', 'react-native-lab').toString()`,
          replaceWith: `def nodeModules = Paths.get(projectDir.getPath(), '../../../../..').toString()`,
        },
        {
          paths: 'build.gradle',
          find: 'sourceBuild = true',
          replaceWith: 'sourceBuild = false',
        },
        {
          paths: 'build.gradle',
          // The `android/versioned-react-native/ReactAndroid/gradle.properties` is not committed to git,
          // we use the `android/ReactAndroid/gradle.properties` for versioned skia instead.
          // Even though it not always correct, e.g. when ReactAndroid upgrades to newer version, the versions are inconsistent.
          // Since skia current only uses the `REACT_NATIVE_VERSION` property,
          // after we prebuild the lib and cleanup CMakeLists.txt, these properties are actually not be used.
          find: '/versioned-react-native/ReactAndroid/gradle.properties',
          replaceWith: '/ReactAndroid/gradle.properties',
        },
        {
          paths: 'ExponentPackage.kt',
          find: 'import com.shopify',
          replaceWith: `import ${prefix}.com.shopify`,
        },
      ],
    },
  };
}

export function exponentPackageTransforms(prefix: string): Record<string, StringTransform[]> {
  return {
    '@shopify/react-native-skia': [
      {
        find: /\bimport (com.shopify.reactnative.skia.RNSkiaPackage)/g,
        replaceWith: `import ${prefix}.$1`,
      },
    ],
    '@shopify/flash-list': [
      {
        find: /\bimport (com.shopify.reactnative.flash_list.ReactNativeFlashListPackage)/g,
        replaceWith: `import ${prefix}.$1`,
      },
    ],
  };
}
