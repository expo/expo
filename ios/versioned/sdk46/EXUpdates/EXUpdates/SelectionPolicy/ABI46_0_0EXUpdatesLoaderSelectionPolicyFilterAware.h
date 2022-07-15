//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLoaderSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An ABI46_0_0EXUpdatesLoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 */
@interface ABI46_0_0EXUpdatesLoaderSelectionPolicyFilterAware : NSObject <ABI46_0_0EXUpdatesLoaderSelectionPolicy>

@end

NS_ASSUME_NONNULL_END
