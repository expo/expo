// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactCompatibleHelpers.h>

#import <React/RCTRootView.h>

#if __has_include(<React-RCTAppDelegate/RCTAppSetupUtils.h>)
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
// react-native < 0.72
#import <React/RCTAppSetupUtils.h>
#endif

UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
#if REACT_NATIVE_MINOR_VERSION >= 71
  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties, fabricEnabled);
#else
  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#endif // REACT_NATIVE_MINOR_VERSION >= 71
}

