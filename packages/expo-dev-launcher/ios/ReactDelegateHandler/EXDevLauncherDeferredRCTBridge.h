// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDevLauncherDeferredRCTBridge is a special no-op class for expo-dev-launcher to defer bridge creation until `EXDevLauncherController` finishing setup.
 */
@interface EXDevLauncherDeferredRCTBridge : RCTBridge

@end

NS_ASSUME_NONNULL_END
