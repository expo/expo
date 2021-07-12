//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesBaseLegacyRawManifest : ABI41_0_0EXUpdatesBaseRawManifest

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

- (NSString *)stableLegacyId;
- (NSString *)scopeKey;
- (nullable NSString *)projectId;

- (NSString *)bundleUrl;
- (nullable NSString *)sdkVersion;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
