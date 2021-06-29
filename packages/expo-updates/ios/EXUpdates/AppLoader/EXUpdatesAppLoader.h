//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^EXUpdatesAppLoaderManifestBlock)(EXUpdatesUpdate *update);
typedef void (^EXUpdatesAppLoaderAssetBlock) (EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
typedef void (^EXUpdatesAppLoaderSuccessBlock)(EXUpdatesUpdate * _Nullable update);
typedef void (^EXUpdatesAppLoaderErrorBlock)(NSError *error);

@interface EXUpdatesAppLoader : NSObject

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
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
               onManifest:(EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
