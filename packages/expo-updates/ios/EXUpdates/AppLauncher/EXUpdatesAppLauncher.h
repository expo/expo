//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppLauncherCompletionBlock)(NSError * _Nullable error, BOOL success);

/**
 * Protocol through which an update can be launched from disk. Classes that implement this protocol
 * are responsible for selecting an eligible update to launch, ensuring all required assets are
 * present, and providing the fields here.
 */
@protocol EXUpdatesAppLauncher

@property (nullable, nonatomic, strong, readonly) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readonly) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readonly) NSDictionary *assetFilesMap;
@property (nonatomic, assign, readonly) BOOL isUsingEmbeddedAssets;

@end

NS_ASSUME_NONNULL_END
