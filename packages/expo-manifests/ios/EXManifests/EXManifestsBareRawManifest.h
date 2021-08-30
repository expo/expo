//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsRawManifest.h>
#import <EXManifests/EXManifestsBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestsBareRawManifest : EXManifestsBaseLegacyRawManifest<EXManifestsRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
