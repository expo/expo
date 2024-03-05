// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXDefines.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

EX_EXTERN_C_BEGIN

/**
 * Enhanced `RCTAppSetupDefaultRootView`.
 */
UIView *EXAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName,  NSDictionary * _Nullable initialProperties, BOOL fabricEnabled);

/**
 * Create a root UIView with React instance binding
 */
UIView *EXCreateReactBindingRootView(id<RCTBridgeDelegate> _Nullable bridgeDelegate, NSDictionary * _Nullable initialProperties, NSDictionary * _Nullable launchOptions);

EX_EXTERN_C_END

NS_ASSUME_NONNULL_END
