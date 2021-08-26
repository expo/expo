//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXRawManifestsBaseLegacyRawManifest : ABI40_0_0EXRawManifestsBaseRawManifest

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
