//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI44_0_0EXUpdatesConfig *)config
                           database:(ABI44_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(ABI44_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
