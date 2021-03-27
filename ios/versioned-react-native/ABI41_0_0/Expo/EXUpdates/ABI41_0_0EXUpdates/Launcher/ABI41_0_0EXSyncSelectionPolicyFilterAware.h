//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncSelectionPolicyFilterAware : NSObject <ABI41_0_0EXSyncSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

+ (BOOL)doesUpdate:(ABI41_0_0EXSyncManifest *)update matchFilters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
