//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(ABI39_0_0EXSyncConfig *)config
                           database:(ABI39_0_0EXSyncDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<ABI39_0_0EXSyncSelectionPolicy>)selectionPolicy
                     launchedUpdate:(ABI39_0_0EXSyncManifest *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
