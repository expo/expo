//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesDatabase.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesSelectionPolicy.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI46_0_0EXUpdatesConfig *)config
                           database:(ABI46_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(ABI46_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
