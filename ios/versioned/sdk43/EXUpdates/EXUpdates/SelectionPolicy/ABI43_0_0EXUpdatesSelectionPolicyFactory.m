//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI43_0_0EXUpdatesSelectionPolicyFactory

+ (ABI43_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[ABI43_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI43_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[ABI43_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (ABI43_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[ABI43_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI43_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[ABI43_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
