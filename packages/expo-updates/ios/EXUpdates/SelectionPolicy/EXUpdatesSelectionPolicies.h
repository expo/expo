//  Copyright © 2021 650 Industries. All rights reserved.

@class EXUpdatesUpdate;

NS_ASSUME_NONNULL_BEGIN

/**
 * Utilities for EXUpdatesSelectionPolicy and related classes
 */
@interface EXUpdatesSelectionPolicies : NSObject

+ (BOOL)doesUpdate:(EXUpdatesUpdate *)update matchFilters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
