//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXRawManifests/EXUpdatesRawManifest.h>
#import <EXRawManifests/EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareRawManifest : EXUpdatesBaseLegacyRawManifest<EXUpdatesRawManifestBehavior>

/**
* A UUID for this manifest.
*/
- (NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
