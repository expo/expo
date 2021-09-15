//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesReaperSelectionPolicyFilterAware

- (NSArray<EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(EXUpdatesUpdate *)launchedUpdate updates:(NSArray<EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate) {
    return @[];
  }
  
  NSMutableArray<EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
  // keep the next newest update that matches all the manifest filters, unless no other updates do
  // in which case, keep the next newest across all updates
  EXUpdatesUpdate *nextNewestUpdate;
  EXUpdatesUpdate *nextNewestUpdateMatchingFilters;
  for (EXUpdatesUpdate *update in updates) {
    // ignore any updates whose scopeKey doesn't match that of the launched update
    if (![launchedUpdate.scopeKey isEqualToString:update.scopeKey]) {
      continue;
    }
    if ([launchedUpdate.commitTime compare:update.commitTime] == NSOrderedDescending) {
      [updatesToDelete addObject:update];
      if (!nextNewestUpdate || [update.commitTime compare:nextNewestUpdate.commitTime] == NSOrderedDescending) {
        nextNewestUpdate = update;
      }
      if ([EXUpdatesSelectionPolicies doesUpdate:update matchFilters:filters] &&
          (!nextNewestUpdateMatchingFilters || [update.commitTime compare:nextNewestUpdateMatchingFilters.commitTime] == NSOrderedDescending)) {
        nextNewestUpdateMatchingFilters = update;
      }
    }
  }
  
  if (nextNewestUpdateMatchingFilters) {
    [updatesToDelete removeObject:nextNewestUpdateMatchingFilters];
  } else if (nextNewestUpdate) {
    [updatesToDelete removeObject:nextNewestUpdate];
  }
  return updatesToDelete;
}

@end

NS_ASSUME_NONNULL_END
