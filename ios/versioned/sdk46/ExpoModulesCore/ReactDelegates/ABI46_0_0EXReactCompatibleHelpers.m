// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXReactCompatibleHelpers.h>

#import <ABI46_0_0React/ABI46_0_0RCTRootView.h>

#if __has_include(<ABI46_0_0React/ABI46_0_0RCTAppSetupUtils.h>)
#import <ABI46_0_0React/ABI46_0_0RCTAppSetupUtils.h>
#endif

UIView *ABI46_0_0EXAppSetupDefaultRootView(ABI46_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if __has_include(<ABI46_0_0React/ABI46_0_0RCTAppSetupUtils.h>)
  return ABI46_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#else
  return [[ABI46_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

