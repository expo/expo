//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncher.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI44_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI44_0_0EXUpdatesUpdate * _Nullable launchableUpdate);

@interface ABI44_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI44_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI44_0_0EXUpdatesConfig *)config
                      database:(ABI44_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(ABI44_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI44_0_0EXUpdatesConfig *)config
                          database:(ABI44_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI44_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
