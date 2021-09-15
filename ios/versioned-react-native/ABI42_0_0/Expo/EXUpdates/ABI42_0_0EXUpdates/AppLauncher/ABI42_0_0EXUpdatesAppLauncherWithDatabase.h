//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAppLauncher.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI42_0_0EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^ABI42_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI42_0_0EXUpdatesUpdate * _Nullable launchableUpdate);

@interface ABI42_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI42_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI42_0_0EXUpdatesConfig *)config
                      database:(ABI42_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(ABI42_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI42_0_0EXUpdatesConfig *)config
                          database:(ABI42_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI42_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
