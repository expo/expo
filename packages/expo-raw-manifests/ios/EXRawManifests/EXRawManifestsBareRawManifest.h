//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXRawManifests/EXRawManifestsRawManifest.h>
#import <EXRawManifests/EXRawManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRawManifestsBareRawManifest : EXRawManifestsBaseLegacyRawManifest<EXRawManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
