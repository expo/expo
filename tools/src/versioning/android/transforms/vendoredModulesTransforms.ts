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
