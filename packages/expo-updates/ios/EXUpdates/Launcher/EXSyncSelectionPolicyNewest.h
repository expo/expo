//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncSelectionPolicyNewest : NSObject <EXSyncSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

@end

NS_ASSUME_NONNULL_END
