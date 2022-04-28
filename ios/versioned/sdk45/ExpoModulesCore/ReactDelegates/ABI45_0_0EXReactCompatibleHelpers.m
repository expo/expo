// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXReactCompatibleHelpers.h>

#import <ABI45_0_0React/ABI45_0_0RCTRootView.h>

#if __has_include(<ABI45_0_0React/ABI45_0_0RCTAppSetupUtils.h>)
#import <ABI45_0_0React/ABI45_0_0RCTAppSetupUtils.h>
#endif

UIView *ABI45_0_0EXAppSetupDefaultRootView(ABI45_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if __has_include(<ABI45_0_0React/ABI45_0_0RCTAppSetupUtils.h>)
  return ABI45_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#else
  return [[ABI45_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

