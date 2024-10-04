//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesReaper : NSObject

/**
 * Safely clears old, unused assets and updates from the filesystem and database.
 *
 * Should be run when no other updates-related events are occurring (e.g. update download).
 */
+ (void)reapUnusedUpdatesWithConfig:(EXUpdatesConfig *)config
                           database:(EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
