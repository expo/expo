//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXSyncLauncher

@property (nullable, nonatomic, strong, readonly) ABI39_0_0EXSyncManifest *launchedUpdate;
@property (nullable, nonatomic, strong, readonly) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readonly) NSDictionary *assetFilesMap;
@property (nonatomic, assign, readonly) BOOL isUsingEmbeddedAssets;

@end

NS_ASSUME_NONNULL_END
