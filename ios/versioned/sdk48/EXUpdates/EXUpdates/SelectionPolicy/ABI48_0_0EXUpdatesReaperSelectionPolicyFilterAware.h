//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesReaperSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An ABI48_0_0EXUpdatesReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates who scope matches that of `launchedUpdate`.
 */
@interface ABI48_0_0EXUpdatesReaperSelectionPolicyFilterAware : NSObject <ABI48_0_0EXUpdatesReaperSelectionPolicy>

@end

NS_ASSUME_NONNULL_END
