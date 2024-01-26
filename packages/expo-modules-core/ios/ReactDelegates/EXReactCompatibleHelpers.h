// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXDefines.h>
#import <React/RCTBridge.h>


EX_EXTERN_C_BEGIN

/**
 * Enhanced `RCTAppSetupDefaultRootView`.
 */
UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled);

EX_EXTERN_C_END
