//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesDatabase.h>

@class EXUpdatesConfig;
@class EXUpdatesUpdate;
@class EXUpdatesSelectionPolicy;

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
