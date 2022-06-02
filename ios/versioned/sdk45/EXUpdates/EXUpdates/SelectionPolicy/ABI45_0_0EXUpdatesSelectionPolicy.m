//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesSelectionPolicy ()

@property (nonatomic, strong) id<ABI45_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong) id<ABI45_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong) id<ABI45_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

@end

@implementation ABI45_0_0EXUpdatesSelectionPolicy

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI45_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI45_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI45_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy
{
  if (self = [super init]) {
    _launcherSelectionPolicy = launcherSelectionPolicy;
    _loaderSelectionPolicy = loaderSelectionPolicy;
    _reaperSelectionPolicy = reaperSelectionPolicy;
  }
  return self;
}

- (nullable ABI45_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI45_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  return [_launcherSelectionPolicy launchableUpdateFromUpdates:updates filters:filters];
}

- (NSArray<ABI45_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI45_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI45_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  return [_reaperSelectionPolicy updatesToDeleteWithLaunchedUpdate:launchedUpdate updates:updates filters:filters];
}

- (BOOL)shouldLoadNewUpdate:(nullable ABI45_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI45_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  return [_loaderSelectionPolicy shouldLoadNewUpdate:newUpdate withLaunchedUpdate:launchedUpdate filters:filters];
}

@end

NS_ASSUME_NONNULL_END
