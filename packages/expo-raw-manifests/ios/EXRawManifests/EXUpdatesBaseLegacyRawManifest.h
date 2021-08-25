//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXRawManifests/EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBaseLegacyRawManifest : EXUpdatesBaseRawManifest

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
