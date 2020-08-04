//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesSelectionPolicy

- (nullable EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<EXUpdatesUpdate *> *)updates;
- (NSArray<EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(EXUpdatesUpdate *)launchedUpdate updates:(NSArray<EXUpdatesUpdate *> *)updates;
- (BOOL)shouldLoadNewUpdate:(nullable EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
