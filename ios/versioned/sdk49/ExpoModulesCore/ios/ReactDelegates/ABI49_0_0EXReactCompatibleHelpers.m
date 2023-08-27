// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXReactCompatibleHelpers.h>

#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>

#if __has_include(<ABI49_0_0React-RCTAppDelegate/ABI49_0_0RCTAppSetupUtils.h>)
#import <ABI49_0_0React-RCTAppDelegate/ABI49_0_0RCTAppSetupUtils.h>
#elif __has_include(<ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppSetupUtils.h>
#else
// react-native < 0.72
#import <ABI49_0_0React/ABI49_0_0RCTAppSetupUtils.h>
#endif

UIView *ABI49_0_0EXAppSetupDefaultRootView(ABI49_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
#if REACT_NATIVE_MINOR_VERSION >= 71
  return ABI49_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties, fabricEnabled);
#else
  return ABI49_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#endif // REACT_NATIVE_MINOR_VERSION >= 71
}

