//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLauncherSelectionPolicyFilterAware ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation EXUpdatesLauncherSelectionPolicyFilterAware

- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  if (self = [super init]) {
    _runtimeVersions = runtimeVersions;
  }
  return self;
}

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [self initWithRuntimeVersions:@[runtimeVersion]];
}

- (nullable EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  EXUpdatesUpdate *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (EXUpdatesUpdate *update in updates) {
    if (![_runtimeVersions containsObject:update.runtimeVersion] || ![EXUpdatesSelectionPolicies doesUpdate:update matchFilters:filters]) {
      continue;
    }
    NSDate *commitTime = update.commitTime;
    if (!runnableUpdateCommitTime || [runnableUpdateCommitTime compare:commitTime] == NSOrderedAscending) {
      runnableUpdate = update;
      runnableUpdateCommitTime = commitTime;
    }
  }
  return runnableUpdate;
}

@end

NS_ASSUME_NONNULL_END
