// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLauncherWithDatabase (Tests)

@property (nonatomic, copy, readonly) EXUpdatesAppLauncherCompletionBlock completion;
@property (nonatomic, strong, readonly) dispatch_queue_t completionQueue;

- (void)_ensureAllAssetsExist;

@end

NS_ASSUME_NONNULL_END
