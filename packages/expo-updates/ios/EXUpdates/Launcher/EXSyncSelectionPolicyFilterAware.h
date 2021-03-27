//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncSelectionPolicyFilterAware : NSObject <EXSyncSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

+ (BOOL)doesUpdate:(EXSyncManifest *)update matchFilters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
