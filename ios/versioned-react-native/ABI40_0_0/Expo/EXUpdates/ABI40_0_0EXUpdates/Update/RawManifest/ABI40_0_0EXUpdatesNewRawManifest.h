//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesRawManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesNewRawManifest : ABI40_0_0EXUpdatesBaseRawManifest<ABI40_0_0EXUpdatesRawManifestBehavior>

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
