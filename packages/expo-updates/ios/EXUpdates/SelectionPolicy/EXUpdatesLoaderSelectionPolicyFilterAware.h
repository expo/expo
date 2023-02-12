//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLoaderSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An EXUpdatesLoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 *
 * Uses `commitTime` to determine ordering of updates.
 */
@interface EXUpdatesLoaderSelectionPolicyFilterAware : NSObject <EXUpdatesLoaderSelectionPolicy>

@end

NS_ASSUME_NONNULL_END
