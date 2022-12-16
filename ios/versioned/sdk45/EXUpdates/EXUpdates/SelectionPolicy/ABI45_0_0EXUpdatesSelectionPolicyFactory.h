//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesSelectionPolicyFactory : NSObject

+ (ABI45_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersion:(NSString *)runtimeVersion;
+ (ABI45_0_0EXUpdatesSelectionPolicy *)filterAwarePolicyWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
