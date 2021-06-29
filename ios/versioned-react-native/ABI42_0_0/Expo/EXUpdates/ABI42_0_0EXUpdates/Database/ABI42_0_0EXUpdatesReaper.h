//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI42_0_0EXUpdatesConfig *)config
                           database:(ABI42_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(ABI42_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
