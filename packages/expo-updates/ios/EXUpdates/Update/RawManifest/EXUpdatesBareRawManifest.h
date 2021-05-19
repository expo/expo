//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesRawManifest.h>
#import <EXUpdates/EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareRawManifest : EXUpdatesBaseLegacyRawManifest<EXUpdatesRawManifestBehavior>

- (nullable NSString *)rawId;
- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
