//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI43_0_0EXUpdatesLoaderSelectionPolicyFilterAware

- (BOOL)shouldLoadNewUpdate:(nullable ABI43_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI43_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  if (!newUpdate) {
    return NO;
  }
  // if the new update doesn't match its own filters, we shouldn't load it
  if (![ABI43_0_0EXUpdatesSelectionPolicies doesUpdate:newUpdate matchFilters:filters]) {
    return NO;
  }
  
  if (!launchedUpdate) {
    return YES;
  }
  // if the current update doesn't pass the manifest filters
  // we should load the new update no matter the commitTime
  if (![ABI43_0_0EXUpdatesSelectionPolicies doesUpdate:launchedUpdate matchFilters:filters]) {
    return YES;
  }
  return [launchedUpdate.commitTime compare:newUpdate.commitTime] == NSOrderedAscending;
}

@end

NS_ASSUME_NONNULL_END
