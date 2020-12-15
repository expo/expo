//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesSelectionPolicyNewest : NSObject <ABI40_0_0EXUpdatesSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
