//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesRawManifest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBaseRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesNewRawManifest : ABI41_0_0EXUpdatesBaseRawManifest<ABI41_0_0EXUpdatesRawManifestBehavior>

- (NSString *)createdAt;
- (NSString *)runtimeVersion;
- (NSDictionary *)launchAsset;
- (nullable NSArray *)assets;

@end

NS_ASSUME_NONNULL_END
