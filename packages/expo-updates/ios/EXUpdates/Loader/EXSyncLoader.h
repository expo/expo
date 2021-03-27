//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^EXSyncLoaderManifestBlock)(EXSyncManifest *update);
typedef void (^EXSyncLoaderSuccessBlock)(EXSyncManifest * _Nullable update);
typedef void (^EXSyncLoaderErrorBlock)(NSError *error);

@interface EXSyncLoader : NSObject

- (instancetype)initWithConfig:(EXSyncConfig *)config
                      database:(EXSyncDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue;

/**
 * Load an update from the given URL, which should respond with a valid manifest.
 *
 * The `onManifest` block is called as soon as the manifest has been downloaded.
 * The block should determine whether or not the update described by this manifest
 * should be downloaded, based on (for example) whether or not it already has the
 * update downloaded locally, and return the corresponding BOOL value.
 */
- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(EXSyncLoaderManifestBlock)manifestBlock
                  success:(EXSyncLoaderSuccessBlock)success
                    error:(EXSyncLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
