//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXUpdatesSelectionPolicy

- (nullable ABI40_0_0EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<ABI40_0_0EXUpdatesUpdate *> *)updates;
- (NSArray<ABI40_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI40_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI40_0_0EXUpdatesUpdate *> *)updates;
- (BOOL)shouldLoadNewUpdate:(nullable ABI40_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI40_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
