//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesSelectionPolicy ()

@property (nonatomic, strong) id<ABI44_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong) id<ABI44_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong) id<ABI44_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

@end

@implementation ABI44_0_0EXUpdatesSelectionPolicy

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI44_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI44_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI44_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy
{
  if (self = [super init]) {
    _launcherSelectionPolicy = launcherSelectionPolicy;
    _loaderSelectionPolicy = loaderSelectionPolicy;
    _reaperSelectionPolicy = reaperSelectionPolicy;
  }
  return self;
}

- (nullable ABI44_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI44_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  return [_launcherSelectionPolicy launchableUpdateFromUpdates:updates filters:filters];
}

- (NSArray<ABI44_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI44_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI44_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  return [_reaperSelectionPolicy updatesToDeleteWithLaunchedUpdate:launchedUpdate updates:updates filters:filters];
}

- (BOOL)shouldLoadNewUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  return [_loaderSelectionPolicy shouldLoadNewUpdate:newUpdate withLaunchedUpdate:launchedUpdate filters:filters];
}

@end

NS_ASSUME_NONNULL_END
