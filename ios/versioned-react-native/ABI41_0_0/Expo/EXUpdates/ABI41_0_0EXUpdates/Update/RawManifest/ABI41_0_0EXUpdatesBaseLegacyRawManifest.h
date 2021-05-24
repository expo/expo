//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesBaseLegacyRawManifest : ABI41_0_0EXUpdatesBaseRawManifest

- (NSString *)bundleUrl;
- (nullable NSString *)sdkVersion;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
