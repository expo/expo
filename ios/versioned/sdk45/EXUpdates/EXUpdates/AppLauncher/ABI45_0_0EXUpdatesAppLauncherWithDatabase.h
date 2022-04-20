//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAppLauncher.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI45_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI45_0_0EXUpdatesUpdate * _Nullable launchableUpdate);

@interface ABI45_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI45_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI45_0_0EXUpdatesConfig *)config
                      database:(ABI45_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(ABI45_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(ABI45_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI45_0_0EXUpdatesConfig *)config
                          database:(ABI45_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI45_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI45_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
