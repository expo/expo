// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>


ABI47_0_0EX_EXTERN_C_BEGIN

/**
 * Backward compatible version of `ABI47_0_0RCTAppSetupDefaultRootView`.
 *
 * `ABI47_0_0RCTAppSetupDefaultRootView` is introduced in react-native 0.68. To make `expo-modules-core` compatible with older react-native,  introduces this compatible helper.
 */
UIView *ABI47_0_0EXAppSetupDefaultRootView(ABI47_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties);

ABI47_0_0EX_EXTERN_C_END
