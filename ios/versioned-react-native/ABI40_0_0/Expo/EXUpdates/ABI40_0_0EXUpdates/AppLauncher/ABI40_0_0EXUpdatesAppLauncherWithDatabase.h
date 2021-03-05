//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAppLauncher.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI40_0_0EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^ABI40_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI40_0_0EXUpdatesUpdate * _Nullable launchableUpdate);

@interface ABI40_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI40_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI40_0_0EXUpdatesConfig *)config
                      database:(ABI40_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(id<ABI40_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                             completion:(ABI40_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI40_0_0EXUpdatesConfig *)config
                          database:(ABI40_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(id<ABI40_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                        completion:(ABI40_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
