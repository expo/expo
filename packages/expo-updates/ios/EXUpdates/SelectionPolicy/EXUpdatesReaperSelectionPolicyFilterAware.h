//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesReaperSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An EXUpdatesReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Chooses only to delete updates who scope matches that of `launchedUpdate`.
 */
@interface EXUpdatesReaperSelectionPolicyFilterAware : NSObject <EXUpdatesReaperSelectionPolicy>

@end

NS_ASSUME_NONNULL_END
