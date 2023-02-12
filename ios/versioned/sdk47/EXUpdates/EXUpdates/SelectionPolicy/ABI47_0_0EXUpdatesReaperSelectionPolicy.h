//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Given a list of updates, implementations of this protocol should choose which of those updates to
 * automatically delete from disk and which ones to keep.
 */
@protocol ABI47_0_0EXUpdatesReaperSelectionPolicy

- (NSArray<ABI47_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI47_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI47_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
