//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsRawManifest.h>
#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXRawManifestsBareRawManifest : ABI40_0_0EXRawManifestsBaseLegacyRawManifest<ABI40_0_0EXRawManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
