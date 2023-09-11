//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesSelectionPolicy.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesReaper : NSObject

/**
 * Safely clears old, unused assets and updates from the filesystem and database.
 *
 * Should be run when no other updates-related events are occurring (e.g. update download).
 */
+ (void)reapUnusedUpdatesWithConfig:(ABI47_0_0EXUpdatesConfig *)config
                           database:(ABI47_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(ABI47_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(ABI47_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
