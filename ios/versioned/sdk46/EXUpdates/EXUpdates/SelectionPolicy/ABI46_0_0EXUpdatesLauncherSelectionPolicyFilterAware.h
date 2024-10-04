//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLauncherSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * An ABI46_0_0EXUpdatesLauncherSelectionPolicy which chooses an update to launch based on the manifest filters
 * provided by the server. If multiple updates meet the criteria, the newest one is chosen, but the
 * manifest filters are always taken into account before the commit time.
 */
@interface ABI46_0_0EXUpdatesLauncherSelectionPolicyFilterAware : NSObject <ABI46_0_0EXUpdatesLauncherSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
