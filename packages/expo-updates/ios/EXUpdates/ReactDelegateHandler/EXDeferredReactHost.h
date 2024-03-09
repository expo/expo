// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactHostWrapper.h>

NS_ASSUME_NONNULL_BEGIN

/**
 EXDeferredRCTBridge is a special no-op class for expo-updates to defer react instance creation until `EXUpdatesAppController` finishing setup.
 */
@interface EXDeferredReactHost : EXReactHostWrapper

@end

NS_ASSUME_NONNULL_END
