//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicies.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware

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

- (nullable ABI44_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI44_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  ABI44_0_0EXUpdatesUpdate *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (ABI44_0_0EXUpdatesUpdate *update in updates) {
    if (![_runtimeVersions containsObject:update.runtimeVersion] || ![ABI44_0_0EXUpdatesSelectionPolicies doesUpdate:update matchFilters:filters]) {
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
