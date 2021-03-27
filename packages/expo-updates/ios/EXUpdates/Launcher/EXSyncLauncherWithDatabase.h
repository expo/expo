//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncLauncher.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXSyncLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^EXSyncLauncherUpdateCompletionBlock)(NSError * _Nullable error, EXSyncManifest * _Nullable launchableUpdate);

@interface EXSyncLauncherWithDatabase : NSObject <EXSyncLauncher>

- (instancetype)initWithConfig:(EXSyncConfig *)config
                      database:(EXSyncDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(id<EXSyncSelectionPolicy>)selectionPolicy
                             completion:(EXSyncLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(EXSyncConfig *)config
                          database:(EXSyncDatabase *)database
                   selectionPolicy:(id<EXSyncSelectionPolicy>)selectionPolicy
                        completion:(EXSyncLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
