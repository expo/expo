//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^ABI40_0_0EXSyncLoaderManifestBlock)(ABI40_0_0EXSyncManifest *update);
typedef void (^ABI40_0_0EXSyncLoaderSuccessBlock)(ABI40_0_0EXSyncManifest * _Nullable update);
typedef void (^ABI40_0_0EXSyncLoaderErrorBlock)(NSError *error);

@interface ABI40_0_0EXSyncLoader : NSObject

- (instancetype)initWithConfig:(ABI40_0_0EXSyncConfig *)config
                      database:(ABI40_0_0EXSyncDatabase *)database
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
               onManifest:(ABI40_0_0EXSyncLoaderManifestBlock)manifestBlock
                  success:(ABI40_0_0EXSyncLoaderSuccessBlock)success
                    error:(ABI40_0_0EXSyncLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
