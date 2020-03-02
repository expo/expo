//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);
typedef void (^EXUpdatesAppLauncherUpdateCompletionBlock)(NSError * _Nullable error, EXUpdatesUpdate * _Nullable launchableUpdate);

@interface EXUpdatesAppLauncherWithDatabase : NSObject <EXUpdatesAppLauncher>

- (instancetype)initWithCompletionQueue:(dispatch_queue_t)completionQueue;

- (void)launchUpdateWithSelectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                             completion:(EXUpdatesAppLauncherCompletionBlock)completion;

+ (void)launchableUpdateWithSelectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                                 completion:(EXUpdatesAppLauncherUpdateCompletionBlock)completion
                            completionQueue:(dispatch_queue_t)completionQueue;

@end

NS_ASSUME_NONNULL_END
