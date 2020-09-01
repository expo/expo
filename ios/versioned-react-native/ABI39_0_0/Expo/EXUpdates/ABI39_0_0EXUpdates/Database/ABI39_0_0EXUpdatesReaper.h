//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI39_0_0EXUpdatesConfig *)config
                           database:(ABI39_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<ABI39_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                     launchedUpdate:(ABI39_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
