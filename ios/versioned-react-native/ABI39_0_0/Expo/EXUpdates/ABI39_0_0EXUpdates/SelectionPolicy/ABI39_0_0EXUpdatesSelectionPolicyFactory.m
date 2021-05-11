//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI39_0_0EXUpdatesSelectionPolicyFactory

+ (ABI39_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[ABI39_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI39_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[ABI39_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI39_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (ABI39_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[ABI39_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI39_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[ABI39_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI39_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
