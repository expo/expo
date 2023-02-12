//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Implementations of this protocol should be able to determine whether to load (either fetch remotely
 * or copy from an embedded location) a new update, given information about the one currently
 * running.
 */
@protocol ABI48_0_0EXUpdatesLoaderSelectionPolicy

- (BOOL)shouldLoadNewUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
