// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAppLauncherWithDatabase.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesAppLauncherWithDatabase (Tests)

@property (nonatomic, copy, readonly) ABI42_0_0EXUpdatesAppLauncherCompletionBlock completion;
@property (nonatomic, strong, readonly) dispatch_queue_t completionQueue;

- (void)_ensureAllAssetsExist;

@end

NS_ASSUME_NONNULL_END
