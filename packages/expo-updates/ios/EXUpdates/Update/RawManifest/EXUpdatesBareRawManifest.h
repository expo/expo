//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesRawManifest.h>
#import <EXUpdates/EXUpdatesBaseLegacyRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareRawManifest : EXUpdatesBaseLegacyRawManifest<EXUpdatesRawManifestBehavior>

- (NSNumber *)commitTimeNumber;
- (nullable NSDictionary *)metadata;

@end

NS_ASSUME_NONNULL_END
