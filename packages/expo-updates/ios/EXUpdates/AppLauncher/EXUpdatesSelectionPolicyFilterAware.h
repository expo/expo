//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesSelectionPolicyFilterAware : NSObject <EXUpdatesSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;
- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions;

- (BOOL)isUpdate:(EXUpdatesUpdate *)update filteredWithFilters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
