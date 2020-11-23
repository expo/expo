//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef BOOL (^ABI40_0_0EXUpdatesAppLoaderManifestBlock)(ABI40_0_0EXUpdatesUpdate *update);
typedef void (^ABI40_0_0EXUpdatesAppLoaderSuccessBlock)(ABI40_0_0EXUpdatesUpdate * _Nullable update);
typedef void (^ABI40_0_0EXUpdatesAppLoaderErrorBlock)(NSError *error);

@interface ABI40_0_0EXUpdatesAppLoader : NSObject

- (instancetype)initWithConfig:(ABI40_0_0EXUpdatesConfig *)config
                      database:(ABI40_0_0EXUpdatesDatabase *)database
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
               onManifest:(ABI40_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                  success:(ABI40_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI40_0_0EXUpdatesAppLoaderErrorBlock)error;

@end

NS_ASSUME_NONNULL_END
