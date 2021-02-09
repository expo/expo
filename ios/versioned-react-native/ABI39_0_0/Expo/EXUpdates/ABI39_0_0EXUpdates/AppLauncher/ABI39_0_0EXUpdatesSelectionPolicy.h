//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXUpdatesSelectionPolicy

- (nullable ABI39_0_0EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<ABI39_0_0EXUpdatesUpdate *> *)updates;
- (NSArray<ABI39_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI39_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI39_0_0EXUpdatesUpdate *> *)updates;
- (BOOL)shouldLoadNewUpdate:(nullable ABI39_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI39_0_0EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
