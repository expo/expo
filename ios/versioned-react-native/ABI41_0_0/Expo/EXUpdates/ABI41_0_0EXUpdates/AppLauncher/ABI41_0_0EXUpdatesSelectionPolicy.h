//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXUpdatesSelectionPolicy

- (nullable ABI41_0_0EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<ABI41_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI41_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI41_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI41_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI41_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI41_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
