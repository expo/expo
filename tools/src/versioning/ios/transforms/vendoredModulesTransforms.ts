import { FileTransforms } from '../../../Transforms.types';

type Config = {
  [key: string]: FileTransforms;
};

export default function vendoredModulesTransformsFactory(prefix: string): Config {
  return {
    '@stripe/stripe-react-native': {
      content: [
        {
          paths: '*.m',
          find: /RCT_EXTERN_MODULE\((ApplePayButtonManager|CardFieldManager|AuBECSDebitFormManager|StripeSdk|StripeContainerManager|CardFormManager)/,
          replaceWith: `RCT_EXTERN_REMAP_MODULE($1, ${prefix}$1`,
        },
        {
          paths: '',
          find: /\.reactFocus\(/,
          replaceWith: `.${prefix.toLowerCase()}ReactFocus(`,
        },
      ],
    },
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
    'react-native-reanimated': {
      content: [
        {
          find: 'namespace reanimated',
          replaceWith: `namespace ${prefix}reanimated`,
        },
        {
          find: /\breanimated::/g,
          replaceWith: `${prefix}reanimated::`,
        },
        {
          paths: '*.h',
          find: /ReactCommon\//g,
          replaceWith: `ReactCommon/${prefix}`,
        },
        {
          paths: '**/Transitioning/*.m',
          find: `RCTConvert+${prefix}REATransition.h`,
          replaceWith: 'RCTConvert+REATransition.h',
        },
        {
          find: /(_bridge_reanimated)/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'REATransitionAnimation.m',
          find: /(SimAnimationDragCoefficient)\(/g,
          replaceWith: `${prefix}$1(`,
        },
      ],
    },
    'react-native-gesture-handler': {
      path: [
        {
          find: /Handlers\/RN(\w+)Handler\.(h|m)/,
          replaceWith: `Handlers/${prefix}RN$1Handler.$2`,
        },
      ],
      content: [
        {
          find: `UIView+${prefix}React.h`,
          replaceWith: `${prefix}UIView+React.h`,
        },
        {
          paths: '*.{h,m}',
          find: /\bRN(\w+)(Handler|GestureRecognizer)\b/g,
          replaceWith: `${prefix}RN$1$2`,
        },
      ],
    },
    'react-native-pager-view': {
      path: [
        {
          find: /(ReactNativePageView|ReactViewPagerManager)\.(h|m)/,
          replaceWith: `${prefix}$1.$2`,
        },
      ],
      content: [
        {
          find: `UIView+${prefix}React.h`,
          replaceWith: `${prefix}UIView+React.h`,
        },
        {
          find: `${prefix}JKBigInteger.h`,
          replaceWith: `JKBigInteger.h`,
        },
      ],
    },
    '@react-native-segmented-control/segmented-control': {
      content: [
        {
          find: `UIView+${prefix}React.h`,
          replaceWith: `${prefix}UIView+React.h`,
        },
      ],
    },
    'react-native-screens': {
      content: [],
    },
  };
}
