//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Utilities for ABI44_0_0EXUpdatesSelectionPolicy and related classes
 */
@interface ABI44_0_0EXUpdatesSelectionPolicies : NSObject

+ (BOOL)doesUpdate:(ABI44_0_0EXUpdatesUpdate *)update matchFilters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
