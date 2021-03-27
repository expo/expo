//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXSyncLauncher

@property (nullable, nonatomic, strong, readonly) EXSyncManifest *launchedUpdate;
@property (nullable, nonatomic, strong, readonly) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readonly) NSDictionary *assetFilesMap;
@property (nonatomic, assign, readonly) BOOL isUsingEmbeddedAssets;

@end

NS_ASSUME_NONNULL_END
