// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDevLauncherDeferredRCTRootView is a special no-op class for expo-dev-launcher to defer bridge creation until `EXDevLauncherController` finishing setup.
 */
@interface EXDevLauncherDeferredRCTRootView : RCTRootView

@end

NS_ASSUME_NONNULL_END
