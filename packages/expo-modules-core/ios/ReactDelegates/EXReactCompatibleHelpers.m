// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactCompatibleHelpers.h>

#import <React/RCTRootView.h>

#if __has_include(<React/RCTAppSetupUtils.h>)
#import <React/RCTAppSetupUtils.h>
#endif

UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
{
#if __has_include(<React/RCTAppSetupUtils.h>)

#if REACT_NATIVE_MINOR_VERSION >= 71
  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties, fabricEnabled);
#else
  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#endif // REACT_NATIVE_MINOR_VERSION >= 71

#else
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif // __has_include(<React/RCTAppSetupUtils.h>)
}

