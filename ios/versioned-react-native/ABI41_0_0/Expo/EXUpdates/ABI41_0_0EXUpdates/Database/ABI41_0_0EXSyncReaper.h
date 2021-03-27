//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicy.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI41_0_0EXSyncConfig *)config
                           database:(ABI41_0_0EXSyncDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
                     launchedUpdate:(ABI41_0_0EXSyncManifest *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
