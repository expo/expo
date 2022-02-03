//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLoaderSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An ABI44_0_0EXUpdatesLoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 */
@interface ABI44_0_0EXUpdatesLoaderSelectionPolicyFilterAware : NSObject <ABI44_0_0EXUpdatesLoaderSelectionPolicy>

@end

NS_ASSUME_NONNULL_END
