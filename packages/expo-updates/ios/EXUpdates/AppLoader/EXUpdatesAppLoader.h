//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@class EXUpdatesUpdateResponse;

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^EXUpdatesAppLoaderUpdateResponseBlock)(EXUpdatesUpdateResponse *updateResponse);
typedef void (^EXUpdatesAppLoaderAssetBlock) (EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount);
typedef void (^EXUpdatesAppLoaderSuccessBlock)(EXUpdatesUpdateResponse * _Nullable updateResponse);
typedef void (^EXUpdatesAppLoaderErrorBlock)(NSError *error);

@interface EXUpdatesAppLoader : NSObject

@property (nonatomic, strong) EXUpdatesConfig *config;

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
                launchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
               completionQueue:(dispatch_queue_t)completionQueue;

/**
 * Load an update from the given URL, which should respond with a valid manifest.
 *
 * The `updateResponseBlock` block is called as soon as the update response has been downloaded.
 * The block should determine whether or not the update described by this update response
 * should be downloaded, based on (for example) whether or not it already has the
 * update downloaded locally, and return the corresponding BOOL value.
 *
 * The `asset` block is called when an asset has either been successfully downloaded
 * or failed to download.
 */
- (void)loadUpdateFromUrl:(NSURL *)url
         onUpdateResponse:(EXUpdatesAppLoaderUpdateResponseBlock)updateResponseBlock
                    asset:(EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
