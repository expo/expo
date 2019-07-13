//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesSelectionPolicy

+ (NSDictionary * _Nullable)runnableUpdateFromUpdates:(NSArray<NSDictionary *>*)updates
{
  NSDictionary *runnableUpdate;
  NSNumber *runnableUpdateCommitTime;
  for (NSDictionary *update in updates) {
    NSArray<NSString *>*compatibleBinaryVersions = [(NSString *)update[@"binary_versions"] componentsSeparatedByString:@","];
    if (![compatibleBinaryVersions containsObject:[[self class] binaryVersion]]) {
      continue;
    }
    NSNumber *commitTime = update[@"commit_time"];
    if (!runnableUpdateCommitTime || [runnableUpdateCommitTime compare:commitTime] == NSOrderedAscending) {
      runnableUpdate = update;
      runnableUpdateCommitTime = commitTime;
    }
  }
  return runnableUpdate;
}

+ (NSString *)binaryVersion
{
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
}

@end

NS_ASSUME_NONNULL_END
