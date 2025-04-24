// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoModulesCore.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDeferredRCTRootView is a special no-op class for expo-updates to defer React instance creation until `EXUpdatesAppController` finishes the setup.
 */
@interface EXDeferredRCTRootView : UIView

@end

NS_ASSUME_NONNULL_END
