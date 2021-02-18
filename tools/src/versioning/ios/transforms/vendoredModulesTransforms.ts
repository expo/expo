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
    'react-native-webview': {
      content: [
        {
          paths: 'RNCWebView.m',
          find: new RegExp(`#import "objc/${prefix}runtime\\.h"`, ''),
          replaceWith: '#import "objc/runtime.h"',
        },
        {
          paths: 'RNCWebView.m',
          find: /\b(_SwizzleHelperWK)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          // see issue: https://github.com/expo/expo/issues/4463
          paths: 'RNCWebView.m',
          find: /MessageHandlerName = @"ABI\d+_\d+_\d+ReactNativeWebView";/,
          replaceWith: `MessageHandlerName = @"ReactNativeWebView";`,
        },
      ],
    },
  };
}
