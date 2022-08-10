//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, EXUpdatesUpdate * _Nullable launchableUpdate);
typedef void (^EXUpdatesAppLauncherQueryCompletionBlock)(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull storedUpdateIds);

@interface EXUpdatesAppLauncherWithDatabase : NSObject <EXUpdatesAppLauncher>

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(EXUpdatesSelectionPolicy *)selectionPolicy
                             completion:(EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithConfig:(EXUpdatesConfig *)config
                          database:(EXUpdatesDatabase *)database
                   selectionPolicy:(EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue;

+ (void)storedUpdateIdsInDatabase:(EXUpdatesDatabase *)database
                       completion:(EXUpdatesAppLauncherQueryCompletionBlock)completionBlock;
@end

NS_ASSUME_NONNULL_END
