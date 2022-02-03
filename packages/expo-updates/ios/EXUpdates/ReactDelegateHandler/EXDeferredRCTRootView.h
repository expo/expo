// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDeferredRCTRootView is a special no-op class for expo-updates to defer bridge creation until `EXUpdatesAppController` finishing setup.
 */
@interface EXDeferredRCTRootView : RCTRootView

@end

NS_ASSUME_NONNULL_END
