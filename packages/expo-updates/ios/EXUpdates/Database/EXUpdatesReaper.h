//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(EXUpdatesConfig *)config
                           database:(EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                     launchedUpdate:(EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
