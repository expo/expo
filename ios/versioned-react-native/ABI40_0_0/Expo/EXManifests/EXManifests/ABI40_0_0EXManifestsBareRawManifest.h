//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXManifests/ABI40_0_0EXManifestsRawManifest.h>
#import <ABI40_0_0EXManifests/ABI40_0_0EXManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXManifestsBareRawManifest : ABI40_0_0EXManifestsBaseLegacyRawManifest<ABI40_0_0EXManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
