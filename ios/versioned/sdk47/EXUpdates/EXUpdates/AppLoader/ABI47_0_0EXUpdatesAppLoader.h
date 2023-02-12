//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAsset.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^ABI47_0_0EXUpdatesAppLoaderManifestBlock)(ABI47_0_0EXUpdatesUpdate *update);
typedef void (^ABI47_0_0EXUpdatesAppLoaderAssetBlock) (ABI47_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
typedef void (^ABI47_0_0EXUpdatesAppLoaderSuccessBlock)(ABI47_0_0EXUpdatesUpdate * _Nullable update);
typedef void (^ABI47_0_0EXUpdatesAppLoaderErrorBlock)(NSError *error);

@interface ABI47_0_0EXUpdatesAppLoader : NSObject

- (instancetype)initWithConfig:(ABI47_0_0EXUpdatesConfig *)config
                      database:(ABI47_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
                launchedUpdate:(nullable ABI47_0_0EXUpdatesUpdate *)launchedUpdate
               completionQueue:(dispatch_queue_t)completionQueue;

/**
 * Load an update from the given URL, which should respond with a valid manifest.
 *
 * The `onManifest` block is called as soon as the manifest has been downloaded.
 * The block should determine whether or not the update described by this manifest
 * should be downloaded, based on (for example) whether or not it already has the
 * update downloaded locally, and return the corresponding BOOL value.
 *
 * The `asset` block is called when an asset has either been successfully downloaded
 * or failed to download.
 */
- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI47_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(ABI47_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(ABI47_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI47_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
