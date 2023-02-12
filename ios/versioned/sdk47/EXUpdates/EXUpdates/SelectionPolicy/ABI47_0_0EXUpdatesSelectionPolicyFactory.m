//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Factory class to ease the construction of [SelectionPolicy] objects whose three methods all use
 * the same ordering policy.
 */
@implementation ABI47_0_0EXUpdatesSelectionPolicyFactory

+ (ABI47_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[ABI47_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI47_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[ABI47_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI47_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (ABI47_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[ABI47_0_0EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[ABI47_0_0EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[ABI47_0_0EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[ABI47_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
