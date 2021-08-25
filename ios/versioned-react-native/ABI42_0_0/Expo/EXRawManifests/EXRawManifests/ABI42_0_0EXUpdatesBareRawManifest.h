//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXRawManifests/ABI42_0_0EXUpdatesRawManifest.h>
#import <ABI42_0_0EXRawManifests/ABI42_0_0EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesBareRawManifest : ABI42_0_0EXUpdatesBaseLegacyRawManifest<ABI42_0_0EXUpdatesRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
