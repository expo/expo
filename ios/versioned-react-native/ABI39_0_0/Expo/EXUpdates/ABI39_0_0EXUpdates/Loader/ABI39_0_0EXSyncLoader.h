//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^ABI39_0_0EXSyncLoaderManifestBlock)(ABI39_0_0EXSyncManifest *update);
typedef void (^ABI39_0_0EXSyncLoaderSuccessBlock)(ABI39_0_0EXSyncManifest * _Nullable update);
typedef void (^ABI39_0_0EXSyncLoaderErrorBlock)(NSError *error);

@interface ABI39_0_0EXSyncLoader : NSObject

- (instancetype)initWithConfig:(ABI39_0_0EXSyncConfig *)config
                      database:(ABI39_0_0EXSyncDatabase *)database
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
               onManifest:(ABI39_0_0EXSyncLoaderManifestBlock)manifestBlock
                  success:(ABI39_0_0EXSyncLoaderSuccessBlock)success
                    error:(ABI39_0_0EXSyncLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
