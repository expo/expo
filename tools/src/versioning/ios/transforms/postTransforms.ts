import chalk from 'chalk';

import { TransformPipeline } from '.';

export function postTransforms(versionName: string): TransformPipeline {
  return {
    logHeader(filePath: string) {
      console.log(`Post-transforming ${chalk.magenta(filePath)}:`);
    },
    transforms: [
      // react-native
      {
        paths: ['RCTRedBox.m', 'RCTLog.mm'],
        replace: /#if (ABI\d+_\d+_\d+)RCT_DEBUG/g,
        with: '#if $1RCT_DEV',
      },
      {
        paths: ['NSTextStorage+FontScaling.h', 'NSTextStorage+FontScaling.m'],
        replace: /NSTextStorage \(FontScaling\)/,
        with: `NSTextStorage (${versionName}FontScaling)`,
      },
      {
        paths: [
          'NSTextStorage+FontScaling.h',
          'NSTextStorage+FontScaling.m',
          'RCTTextShadowView.m',
        ],
        replace: /\b(scaleFontSizeToFitSize|scaleFontSizeWithRatio|compareToSize)\b/g,
        with: `${versionName.toLowerCase()}_rct_$1`,
      },
      {
        paths: 'RCTWebView.m',
        replace: /@"ABI\d+_\d+_\d+React-js-navigation"/,
        with: '@"react-js-navigation"',
      },
      {
        replace: new RegExp(`FB${versionName}ReactNativeSpec`, 'g'),
        with: 'FBReactNativeSpec',
      },
      {
        replace: new RegExp('\\b(Native\\w+Spec)\\b', 'g'),
        with: `${versionName}$1`,
      },
      {
        paths: 'RCTInspectorPackagerConnection.m',
        replace: /\b(RECONNECT_DELAY_MS)\b/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'RCTView.m',
        replace: /\b(SwitchAccessibilityTrait)\b/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'RCTSpringAnimation.m',
        replace: /\b(MAX_DELTA_TIME)\b/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'ModuleRegistry.cpp',
        replace: /(std::string normalizeName\(std::string name\) \{)/,
        with: `$1\n  if (name.compare(0, ${versionName.length}, "${versionName}") == 0) {\n    name = name.substr(${versionName.length});\n  }\n`,
      },
      {
        paths: 'ModuleRegistry.cpp',
        replace: /(\(name\.compare\(\d+, \d+, ")([^"]+)(RCT"\))/,
        with: '$1$3',
      },
      {
        paths: ['RCTSRWebSocket.h', 'UIView+Private.h'],
        replace: /@interface (\w+) \((CertificateAdditions|Private)\)/g,
        with: `@interface $1 (${versionName}$2)`,
      },
      {
        // Fix prefixing imports from React-bridging
        paths: 'ReactCommon',
        replace: new RegExp(`(React)\\/${versionName}(bridging)\\/`, 'g'),
        with: `$1/$2/${versionName}`,
      },
      {
        // Files inside fabric diretory used to have nested import paths and we transformed it wrong.
        // This rules are here to fix it.
        // e.g. `#include <react/debug/react_native_assert.h>`
        //   -> `#include <ABI49_0_0React/ABI49_0_0debug/ABI49_0_0React_native_assert.h>`
        //   -> `#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>`
        paths: ['ReactCommon/react/', 'React/'],
        replace: new RegExp(
          `(^(#include|#import) <${versionName}React)/${versionName}([^/\\n]+?)/(${versionName})?([^/\\n]+?\\.h>$)`,
          'gm'
        ),
        with: `$1/$3/${versionName}$5`,
      },
      {
        // Same as above but for difference nested level.
        paths: ['Libraries/AppDelegate/', 'ReactCommon/react/', 'React/'],
        replace: new RegExp(
          `(^(#include|#import) <${versionName}React)/${versionName}([^/\\n]+?)\\/([^/\\n]+?)\\/(${versionName})?([^/\\n]+?\\.h>$)`,
          'gm'
        ),
        with: `$1/$3/$4/${versionName}$6`,
      },
      {
        // Codegen adds methods to `RCTCxxConvert` that start with `JS_`, which refer to `JS::`
        // C++ namespace that we prefix, so these methods must be prefixed as well.
        paths: ['FBReactNativeSpec.h', 'FBReactNativeSpec-generated.mm'],
        replace: /(RCTManagedPointer \*\))(JS_)/g,
        with: `$1${versionName}$2`,
      },

      // Universal modules
      {
        paths: `UniversalModules/${versionName}EXScoped`,
        replace: /(EXScopedABI\d+_\d+_\d+ReactNative)/g,
        with: 'EXScopedReactNative',
      },
      {
        paths: `${versionName}EXFileSystem`,
        replace: new RegExp(`NSData\\+${versionName}EXFileSystem\\.h`, 'g'),
        with: `${versionName}NSData+EXFileSystem.h`,
      },
      {
        paths: [
          `${versionName}EXNotifications`,
          `${versionName}EXUpdates`,
          `${versionName}EXJSONUtils`,
        ],
        replace: new RegExp(
          `NSDictionary\\+${versionName}(EXNotificationsVerifyingClass|EXJSONUtils)\\.h`,
          'g'
        ),
        with: `${versionName}NSDictionary+$1.h`,
      },
      {
        paths: [
          `${versionName}EXNotifications`,
          `${versionName}EXAppState`,
          `${versionName}EXVersionManager`,
        ],
        replace: new RegExp(`EXModuleRegistryHolder${versionName}React`, 'g'),
        with: 'EXModuleRegistryHolderReact',
      },
      {
        // Versioned ExpoKit has to use versioned modules provider
        paths: 'EXVersionManager.mm',
        replace: /@"(ExpoModulesProvider)"/,
        with: `@"${versionName}$1"`,
      },
      {
        paths: `${versionName}EXVersionManager.mm`,
        replace: `#import <${versionName}Reacthermes/HermesExecutorFactory.h>`,
        with: `#import <${versionName}reacthermes/${versionName}HermesExecutorFactory.h>`,
      },

      // react-native-maps
      {
        paths: 'AIRMapWMSTile',
        replace: /\b(TileOverlay)\b/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'AIRGoogleMapWMSTile',
        replace: /\b(WMSTileOverlay)\b/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'AIRGoogleMap',
        replace: new RegExp(`^#import "${versionName}(GMU.+?\\.h)"`, 'gm'),
        with: `#import <Google-Maps-iOS-Utils/$1>`,
      },

      // react-native-webview
      {
        paths: 'RNCWebView.m',
        replace: new RegExp(`#import "objc/${versionName}runtime\\.h"`, ''),
        with: '#import "objc/runtime.h"',
      },
      {
        paths: 'RNCWebView.m',
        replace: /\b(_SwizzleHelperWK)\b/g,
        with: `${versionName}$1`,
      },
      {
        // see issue: https://github.com/expo/expo/issues/4463
        paths: 'RNCWebView.m',
        replace: /MessageHandlerName = @"ABI\d+_\d+_\d+ReactNativeWebView";/,
        with: `MessageHandlerName = @"ReactNativeWebView";`,
      },
      {
        paths: 'EXVersionManager.mm',
        replace: /\[(RNCWebView)/,
        with: `[${versionName}$1`,
      },

      // react-native-reanimated
      {
        paths: 'EXVersionManager.mm',
        replace: /(_bridge_reanimated)/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'EXVersionManager.mm',
        replace: /\b(REA)/g,
        with: `${versionName}$1`,
      },
      {
        paths: 'NativeProxy.mm',
        replace: /@"ABI\d+_\d+_\d+RCTView"/g,
        with: `@"RCTView"`,
      },

      // react-native-shared-element
      {
        paths: 'RNSharedElementNode.m',
        replace: /\b(NSArray\s*\*\s*_imageResolvers)\b/,
        with: 'static $1',
      },

      // react-native-safe-area-context
      {
        paths: [
          'RNCSafeAreaUtils.h',
          'RNCSafeAreaUtils.m',
          'RNCSafeAreaProvider.m',
          'RNCSafeAreaView.m',
        ],
        replace: /\b(UIEdgeInsetsEqualToEdgeInsetsWithThreshold)\b/g,
        with: `${versionName}$1`,
      },
    ],
  };
}
