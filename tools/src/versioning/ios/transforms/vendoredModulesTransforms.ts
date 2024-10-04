import { FileTransforms } from '../../../Transforms.types';

type Config = {
  [key: string]: FileTransforms;
};

export default function vendoredModulesTransformsFactory(prefix: string): Config {
  return {
    '@stripe/stripe-react-native': {
      content: [
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
          paths: 'ContainerView.swift',
          find: /\breactSetFrame/g,
          replaceWith: `${prefix.toLowerCase()}ReactSetFrame`,
        },
      ],
    },
    'react-native-webview': {
      content: [
        {
          paths: 'RNCWebViewImpl.m',
          find: /\b(_SwizzleHelperWK)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          // see issue: https://github.com/expo/expo/issues/4463
          paths: 'RNCWebViewImpl.m',
          find: /MessageHandlerName = @"ABI\d+_\d+_\d+ReactNativeWebView";/,
          replaceWith: `MessageHandlerName = @"ReactNativeWebView";`,
        },
        {
          paths: 'RNCWebViewImpl.m',
          find: 'NSString *const CUSTOM_SELECTOR',
          replaceWith: 'static NSString *const CUSTOM_SELECTOR',
        },
      ],
    },
    'react-native-reanimated': {
      path: [
        {
          find: /\b(ReanimatedSensor)/g,
          replaceWith: `${prefix}$1`,
        },
      ],
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
          find: new RegExp(`ReactCommon/(?!${prefix})`, 'g'),
          replaceWith: `ReactCommon/${prefix}`,
        },
        {
          paths: '**/Transitioning/*.m',
          find: `RCTConvert+${prefix}REATransition.h`,
          replaceWith: 'RCTConvert+REATransition.h',
        },
        {
          paths: 'REAUIManager.{h,mm}',
          find: /(blockSetter|_toBeRemovedRegister|_parentMapper|_animationsManager|_scheduler)/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'REATransitionAnimation.m',
          find: /(SimAnimationDragCoefficient)\(/g,
          replaceWith: `${prefix}$1(`,
        },
        {
          paths: 'REAAnimationsManager.m',
          find: /^(#import <.*React)\/UIView\+(.+)\.h>/gm,
          replaceWith: `$1/${prefix}UIView+$2.h>`,
        },
        {
          paths: 'REAAnimationsManager.m',
          // `dataComponenetsByName[@"ABI44_0_0RCTView"];` -> `dataComponenetsByName[@"RCTView"];`
          // the RCTComponentData internal view name is not versioned
          find: new RegExp(`(RCTComponentData .+)\\[@"${prefix}(RCT.+)"\\];`, 'g'),
          replaceWith: '$1[@"$2"];',
        },
        {
          paths: ['**/sensor/**', 'NativeProxy.mm'],
          find: /\b(ReanimatedSensor)/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'REANodesManager.mm',
          find: /\b(ComponentUpdate)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'REASnapshot.m',
          find: /^(const int (ScreenStackPresentationModal|DEFAULT_MODAL_TOP_OFFSET))/gm,
          replaceWith: `static $1`,
        },
        {
          paths: [
            'NativeProxy.mm',
            'ReanimatedRuntime.h',
            'ReanimatedRuntime.cpp',
            'ReanimatedHermesRuntime.h',
            'ReanimatedHermesRuntime.cpp',
            'REAMessageThread.h',
          ],
          find: new RegExp(
            `(__has_include\\(|#import\\s+|#include\\s+)<(cxxreact|reacthermes)\\/(${prefix})?(MessageQueueThread|HermesExecutorFactory)(\\.h>\\)?)`,
            'g'
          ),
          replaceWith: `$1<${prefix}$2/${prefix}$4$5`,
        },
        {
          paths: ['ReanimatedRuntime.h', 'ReanimatedHermesRuntime.h'],
          find: `        <reacthermes/${prefix}HermesExecutorFactory.h>) || __has_include(<hermes/hermes.h>))`,
          replaceWith: `        <${prefix}reacthermes/${prefix}HermesExecutorFactory.h>) || __has_include(<hermes/hermes.h>))`,
        },
        {
          paths: ['ReanimatedHermesRuntime.h', 'ReanimatedHermesRuntime.cpp'],
          find: /^((#if __has_include|#include).+\/)(RuntimeAdapter|Registration)(\.h>)$/gm,
          replaceWith: `$1${prefix}$3$4`,
        },
        {
          paths: 'RCTAppDelegate+Reanimated.h',
          find: new RegExp(`<${prefix}React-${prefix}RCTAppDelegate/`, 'g'),
          replaceWith: `<${prefix}React-RCTAppDelegate/`,
        },
        {
          paths: 'RCTAppDelegate+Reanimated.h',
          find: new RegExp(
            `(#if __has_include\\(|#import )<${prefix}React-cxxreact/cxxreact/JSExecutor\\.h>`,
            'g'
          ),
          replaceWith: `$1<${prefix}React-cxxreact/${prefix}cxxreact/${prefix}JSExecutor.h>`,
        },
        {
          // Workaround for jsi somehow be transformed back to unversioned path
          find: /^#include <jsi\/jsi\.h>/gm,
          replaceWith: `#include <${prefix}jsi/${prefix}jsi.h>`,
        },
        {
          paths: 'RNReanimated.podspec.json',
          find: /(REACT_NATIVE_MINOR_VERSION|REANIMATED_VERSION)/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'RNReanimated.podspec.json',
          find: new RegExp(
            `\\/react-native-lab\\/react-native\\/packages\\/react-native\\/${prefix}ReactCommon`,
            'g'
          ),
          replaceWith: `/ios/versioned-react-native/${prefix}/ReactNative/ReactCommon`,
        },
      ],
    },
    'react-native-gesture-handler': {
      path: [
        {
          find: /\bRN(\w+?)\.(h|m|mm)/,
          replaceWith: `${prefix}RN$1.$2`,
        },
      ],
      content: [
        {
          // `RNG*` symbols are already prefixed at this point,
          // but there are some new symbols in RNGH that don't have "G".
          paths: '*.{h,m,mm}',
          find: /\bRN(\w+?)\b/g,
          replaceWith: `${prefix}RN$1`,
        },
        {
          paths: 'RNGestureHandler.m',
          find: /UIGestureRecognizer \(GestureHandler\)/g,
          replaceWith: `UIGestureRecognizer (${prefix}GestureHandler)`,
        },
        {
          paths: 'RNGestureHandler.m',
          find: /gestureHandler/g,
          replaceWith: `${prefix}gestureHandler`,
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
          find: `${prefix}JKBigInteger.h`,
          replaceWith: `JKBigInteger.h`,
        },
      ],
    },
    'react-native-screens': {
      content: [],
    },
    '@shopify/react-native-skia': {
      path: [
        {
          find: /\b(DisplayLink|PlatformContext|SkiaDrawView|SkiaDrawViewManager|SkiaManager|SkiaUIView|SkiaPictureViewManager|SkiaDomViewManager|ViewScreenshotService)/g,
          replaceWith: `${prefix}$1`,
        },
      ],
      content: [
        {
          paths: '*.h',
          find: new RegExp(`ReactCommon/(?!${prefix})`, 'g'),
          replaceWith: `ReactCommon/${prefix}`,
        },
        {
          find: /\b(DisplayLink|PlatformContext|SkiaDrawView|SkiaDrawViewManager|SkiaManager|RNJsi|SkiaUIView|SkiaPictureViewManager|SkiaDomViewManager|ViewScreenshotService)/g,
          replaceWith: `${prefix}$1`,
        },
        {
          find: /RCT_EXPORT_MODULE\((SkiaDomView)\)/g,
          replaceWith: `RCT_EXPORT_MODULE(${prefix}$1)`,
        },
        {
          // The module name in bridge should be unversioned `RNSkia`
          paths: '*.mm',
          find: new RegExp(`(\\smoduleForName:@")${prefix}(RNSkia")`, 'g'),
          replaceWith: '$1$2',
        },
        {
          // __typename__ exposed to js should be unversioned
          find: new RegExp(
            `(\\bJSI_PROPERTY_GET\\(__typename__\\) \\{\\n\\s*return jsi::String::createFromUtf8\\(runtime, ")${prefix}(.*")`,
            'gm'
          ),
          replaceWith: '$1$2',
        },
      ],
    },
    'react-native-svg': {
      content: [
        {
          find: new RegExp(`\\b(${prefix}RCTConvert)\\+${prefix}(RNSVG\.h)`, 'g'),
          replaceWith: `$1+$2`,
        },
        {
          paths: 'RNSVGRenderable.mm',
          find: /\b(saturate)\(/g,
          replaceWith: `${prefix}$1(`,
        },
        {
          paths: 'RNSVGPainter.mm',
          find: /\b(PatternFunction)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'RNSVGFontData.mm',
          find: /\b(AbsoluteFontWeight|bolder|lighter|nearestFontWeight)\(/gi,
          replaceWith: `${prefix}$1(`,
        },
        {
          paths: 'RNSVGTSpan.mm',
          find: new RegExp(`\\b(${prefix}RNSVGTopAlignedLabel\\s*\\*\\s*label)\\b`, 'gi'),
          replaceWith: 'static $1',
        },
        {
          paths: 'RNSVGMarker.mm',
          find: /\b(deg2rad)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'RNSVGMarkerPosition.mm',
          find: /\b(PathIsDone|rad2deg|SlopeAngleRadians|CurrentAngle|subtract|ExtractPathElementFeatures|UpdateFromPathElement)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'RNSVGMarkerPosition.mm',
          find: /\b(positions_|element_index_|origin_|subpath_start_|in_slope_|out_slope_|auto_start_reverse_)\b/g,
          replaceWith: `${prefix}$1`,
        },
        {
          paths: 'RNSVGPathMeasure.mm',
          find: /\b(distance|subdivideBezierAtT)\b/g,
          replaceWith: `${prefix}$1`,
        },
      ],
    },
  };
}
