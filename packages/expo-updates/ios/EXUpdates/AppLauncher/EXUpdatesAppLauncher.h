//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);

@protocol EXUpdatesAppLauncher

@property (nullable, nonatomic, strong, readonly) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readonly) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readonly) NSDictionary *assetFilesMap;
@property (nonatomic, assign, readonly) BOOL isUsingEmbeddedAssets;

@end

NS_ASSUME_NONNULL_END
