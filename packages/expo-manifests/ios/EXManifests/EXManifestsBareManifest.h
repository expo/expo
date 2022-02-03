//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsManifest.h>
#import <EXManifests/EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestsBareManifest : EXManifestsBaseLegacyManifest<EXManifestsManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
