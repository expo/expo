//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLauncherSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesLoaderSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesSelectionPolicyFactory.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesSelectionPolicyFactory

+ (EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [[EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion]
          loaderSelectionPolicy:[[EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

+ (EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  return [[EXUpdatesSelectionPolicy alloc]
          initWithLauncherSelectionPolicy:[[EXUpdatesLauncherSelectionPolicyFilterAware alloc] initWithRuntimeVersions:runtimeVersions]
          loaderSelectionPolicy:[[EXUpdatesLoaderSelectionPolicyFilterAware alloc] init]
          reaperSelectionPolicy:[[EXUpdatesReaperSelectionPolicyFilterAware alloc] init]];
}

@end

NS_ASSUME_NONNULL_END
