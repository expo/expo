//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncher.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI43_0_0EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^ABI43_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI43_0_0EXUpdatesUpdate * _Nullable launchableUpdate);

@interface ABI43_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI43_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI43_0_0EXUpdatesConfig *)config
                      database:(ABI43_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(ABI43_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI43_0_0EXUpdatesConfig *)config
                          database:(ABI43_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI43_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
