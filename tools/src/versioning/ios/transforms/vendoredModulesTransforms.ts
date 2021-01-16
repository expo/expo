import { FileTransforms } from '../../../Transforms.types';

type Config = {
  [key: string]: FileTransforms;
};

export default function vendoredModulesTransformsFactory(prefix: string): Config {
  return {
    'lottie-react-native': {
      content: [
        {
          paths: 'LRNAnimationViewManagerObjC.m',
          find: /RCT_EXTERN_MODULE\(/,
          replaceWith: `RCT_EXTERN_REMAP_MODULE(LottieAnimationView, ${prefix}`,
        },
        {
          paths: 'ContainerView.swift',
          find: /\breactSetFrame/g,
          replaceWith: `${prefix.toLowerCase()}ReactSetFrame`,
        },
      ],
    },
  };
}
