// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>


ABI45_0_0EX_EXTERN_C_BEGIN

/**
 * Backward compatible version of `ABI45_0_0RCTAppSetupDefaultRootView`.
 *
 * `ABI45_0_0RCTAppSetupDefaultRootView` is introduced in react-native 0.68. To make `expo-modules-core` compatible with older react-native,  introduces this compatible helper.
 */
UIView *ABI45_0_0EXAppSetupDefaultRootView(ABI45_0_0RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties);

ABI45_0_0EX_EXTERN_C_END
