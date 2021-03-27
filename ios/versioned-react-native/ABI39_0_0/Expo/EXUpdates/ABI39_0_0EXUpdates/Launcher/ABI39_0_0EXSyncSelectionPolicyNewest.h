//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncSelectionPolicyNewest : NSObject <ABI39_0_0EXSyncSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
