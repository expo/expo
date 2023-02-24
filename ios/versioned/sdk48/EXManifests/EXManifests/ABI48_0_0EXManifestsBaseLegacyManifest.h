//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsBaseManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXManifestsBaseLegacyManifest : ABI48_0_0EXManifestsBaseManifest

- (nullable NSDictionary *)expoGoConfigRootObject;
- (nullable NSDictionary *)expoClientConfigRootObject;

- (NSString *)stableLegacyId;
- (NSString *)scopeKey;
- (nullable NSString *)easProjectId;

- (NSString *)bundleUrl;
- (nullable NSString *)sdkVersion;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
