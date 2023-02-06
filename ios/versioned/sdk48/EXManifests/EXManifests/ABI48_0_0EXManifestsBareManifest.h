//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsManifest.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXManifestsBareManifest : ABI48_0_0EXManifestsBaseLegacyManifest<ABI48_0_0EXManifestsManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
