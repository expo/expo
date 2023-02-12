//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesAppLauncher.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI46_0_0EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, ABI46_0_0EXUpdatesUpdate * _Nullable launchableUpdate);
typedef void (^ABI46_0_0EXUpdatesAppLauncherQueryCompletionBlock)(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull storedUpdateIds);

@interface ABI46_0_0EXUpdatesAppLauncherWithDatabase : NSObject <ABI46_0_0EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(ABI46_0_0EXUpdatesConfig *)config
                      database:(ABI46_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(ABI46_0_0EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(ABI46_0_0EXUpdatesConfig *)config
                          database:(ABI46_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI46_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

+ (void)storedUpdateIdsInDatabase:(ABI46_0_0EXUpdatesDatabase *)database
                       completion:(ABI46_0_0EXUpdatesAppLauncherQueryCompletionBlock)completionBlock;
@end

NS_ASSUME_NONNULL_END
