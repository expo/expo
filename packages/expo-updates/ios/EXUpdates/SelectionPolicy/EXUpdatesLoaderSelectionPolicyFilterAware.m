//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesLoaderSelectionPolicyFilterAware

- (BOOL)shouldLoadNewUpdate:(nullable EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  if (!newUpdate) {
    return NO;
  }
  // if the new update doesn't match its own filters, we shouldn't load it
  if (![EXUpdatesSelectionPolicies doesUpdate:newUpdate matchFilters:filters]) {
    return NO;
  }
  
  if (!launchedUpdate) {
    return YES;
  }
  // if the current update doesn't pass the manifest filters
  // we should load the new update no matter the commitTime
  if (![EXUpdatesSelectionPolicies doesUpdate:launchedUpdate matchFilters:filters]) {
    return YES;
  }
  return [launchedUpdate.commitTime compare:newUpdate.commitTime] == NSOrderedAscending;
}

@end

NS_ASSUME_NONNULL_END
