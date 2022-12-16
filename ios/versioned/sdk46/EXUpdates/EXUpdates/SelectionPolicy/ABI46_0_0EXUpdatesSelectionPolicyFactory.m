//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI46_0_0EXUpdatesSelectionPolicyFactory

+ (ABI46_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[ABI46_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI46_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[ABI46_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI46_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (ABI46_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[ABI46_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI46_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[ABI46_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI46_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
