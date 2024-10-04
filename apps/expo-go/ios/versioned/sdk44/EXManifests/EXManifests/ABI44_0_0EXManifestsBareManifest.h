//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsBaseLegacyManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXManifestsBareManifest : ABI44_0_0EXManifestsBaseLegacyManifest<ABI44_0_0EXManifestsManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
