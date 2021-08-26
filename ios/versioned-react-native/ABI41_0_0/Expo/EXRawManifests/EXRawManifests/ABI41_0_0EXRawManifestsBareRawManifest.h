//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXRawManifests/ABI41_0_0EXRawManifestsRawManifest.h>
#import <ABI41_0_0EXRawManifests/ABI41_0_0EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXRawManifestsBareRawManifest : ABI41_0_0EXRawManifestsBaseLegacyRawManifest<ABI41_0_0EXRawManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
