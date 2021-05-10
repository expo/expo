//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBaseLegacyRawManifest : EXUpdatesBaseRawManifest

- (NSString *)bundleUrl;
- (nullable NSString *)sdkVersion;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
