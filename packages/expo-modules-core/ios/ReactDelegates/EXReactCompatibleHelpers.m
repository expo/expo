// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactCompatibleHelpers.h>

#import <React/RCTRootView.h>

#if __has_include(<React/RCTAppSetupUtils.h>)
#import <React/RCTAppSetupUtils.h>
#endif

UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if __has_include(<React/RCTAppSetupUtils.h>)
  return RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#else
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

