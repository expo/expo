// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactHostWrapper.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDevLauncherDeferredRCTBridge is a special no-op class for expo-dev-launcher to defer react instance creation until `EXDevLauncherController` finishing setup.
 */
@interface EXDevLauncherDeferredReactHost : EXReactHostWrapper

@end

NS_ASSUME_NONNULL_END
