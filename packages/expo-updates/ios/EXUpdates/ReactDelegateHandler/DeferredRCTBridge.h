// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

/**
 DeferredRCTBridge is a special no-op class for expo-updates to defer bridge creation until `EXUpdatesAppController` finishing setup.
 */
@interface DeferredRCTBridge : RCTBridge

@end

NS_ASSUME_NONNULL_END
