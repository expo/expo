//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI44_0_0EXUpdatesSelectionPolicyFactory

+ (ABI44_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[ABI44_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[ABI44_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI44_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (ABI44_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[ABI44_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI44_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[ABI44_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI44_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
