//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncReaper : NSObject

+ (void)reapUnusedUpdatesWithConfig:(EXSyncConfig *)config
                           database:(EXSyncDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<EXSyncSelectionPolicy>)selectionPolicy
                     launchedUpdate:(EXSyncManifest *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
