//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXRawManifests/ABI42_0_0EXRawManifestsRawManifest.h>
#import <ABI42_0_0EXRawManifests/ABI42_0_0EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXRawManifestsBareRawManifest : ABI42_0_0EXRawManifestsBaseLegacyRawManifest<ABI42_0_0EXRawManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
