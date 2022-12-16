// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <ExpoModulesCore/EXDefines.h>
#import <React/RCTBridge.h>


EX_EXTERN_C_BEGIN

/**
 * Backward compatible version of `RCTAppSetupDefaultRootView`.
 *
 * `RCTAppSetupDefaultRootView` is introduced in react-native 0.68. To make `expo-modules-core` compatible with older react-native,  introduces this compatible helper.
 */
UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled);

EX_EXTERN_C_END
