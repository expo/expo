//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsManifest.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXManifestsBareManifest : ABI45_0_0EXManifestsBaseLegacyManifest<ABI45_0_0EXManifestsManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
