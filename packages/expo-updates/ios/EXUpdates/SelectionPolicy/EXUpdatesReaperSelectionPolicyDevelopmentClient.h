//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesReaperSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An EXUpdatesReaperSelectionPolicy which keeps a predefined maximum number of updates across all scopes,
 * and, once that number is surpassed, selects the updates least recently accessed (and then least
 * recently published) to delete. Ignores filters and scopes.
 *
 * Uses the `lastAccessed` property to determine ordering of updates.
 */
@interface EXUpdatesReaperSelectionPolicyDevelopmentClient : NSObject <EXUpdatesReaperSelectionPolicy>

- (instancetype)initWithMaxUpdatesToKeep:(NSUInteger)maxUpdatesToKeep;

@end

NS_ASSUME_NONNULL_END
