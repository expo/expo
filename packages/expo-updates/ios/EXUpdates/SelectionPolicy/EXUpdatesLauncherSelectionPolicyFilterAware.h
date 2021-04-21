//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLauncherSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLauncherSelectionPolicyFilterAware : NSObject <EXUpdatesLauncherSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
