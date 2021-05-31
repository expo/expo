//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesRawManifest.h>
#import <EXUpdatesInterface/EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareRawManifest : EXUpdatesBaseLegacyRawManifest<EXUpdatesRawManifestBehavior>

- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
