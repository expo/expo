//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesLauncherSelectionPolicyFilterAware ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation ABI48_0_0EXUpdatesLauncherSelectionPolicyFilterAware

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

- (nullable ABI48_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI48_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  ABI48_0_0EXUpdatesUpdate *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (ABI48_0_0EXUpdatesUpdate *update in updates) {
    if (![_runtimeVersions containsObject:update.runtimeVersion] || ![ABI48_0_0EXUpdatesSelectionPolicies doesUpdate:update matchFilters:filters]) {
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
