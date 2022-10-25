// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXReactCompatibleHelpers.h>

#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>

#if __has_include(<ABI47_0_0React/ABI47_0_0RCTAppSetupUtils.h>)
#import <ABI47_0_0React/ABI47_0_0RCTAppSetupUtils.h>
#endif

UIView *ABI47_0_0EXAppSetupDefaultRootView(ABI47_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties)
{
#if __has_include(<ABI47_0_0React/ABI47_0_0RCTAppSetupUtils.h>)
  return ABI47_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initialProperties);
#else
  return [[ABI47_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
#endif
}

