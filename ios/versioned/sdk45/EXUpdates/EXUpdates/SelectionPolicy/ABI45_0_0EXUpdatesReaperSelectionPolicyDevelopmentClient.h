//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesReaperSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An ABI45_0_0EXUpdatesReaperSelectionPolicy which keeps a predefined maximum number of updates across all scopes,
 * and, once that number is surpassed, selects the updates least recently accessed (and then least
 * recently published) to delete. Ignores filters and scopes.
 */
@interface ABI45_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient : NSObject <ABI45_0_0EXUpdatesReaperSelectionPolicy>

- (instancetype)initWithMaxUpdatesToKeep:(NSUInteger)maxUpdatesToKeep;

@end

NS_ASSUME_NONNULL_END
