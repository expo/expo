//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncLauncher.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI41_0_0EXSyncLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^ABI41_0_0EXSyncLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI41_0_0EXSyncManifest * _Nullable launchableUpdate);

@interface ABI41_0_0EXSyncLauncherWithDatabase : NSObject <ABI41_0_0EXSyncLauncher>

- (instancetype)initWithConfig:(ABI41_0_0EXSyncConfig *)config
                      database:(ABI41_0_0EXSyncDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
                             completion:(ABI41_0_0EXSyncLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI41_0_0EXSyncConfig *)config
                          database:(ABI41_0_0EXSyncDatabase *)database
                   selectionPolicy:(id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
                        completion:(ABI41_0_0EXSyncLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
