//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsRawManifest.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXManifestsBareRawManifest : ABI41_0_0EXManifestsBaseLegacyRawManifest<ABI41_0_0EXManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
