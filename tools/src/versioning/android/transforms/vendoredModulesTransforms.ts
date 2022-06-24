import { FileTransforms } from '../../../Transforms.types';

type Config = {
  [key: string]: FileTransforms;
};

export default function vendoredModulesTransformsFactory(prefix: string): Config {
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
      ],
    },
  };
}
