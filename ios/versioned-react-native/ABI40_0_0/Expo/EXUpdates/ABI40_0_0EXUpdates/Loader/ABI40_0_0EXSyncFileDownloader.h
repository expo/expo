//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI40_0_0EXSyncFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI40_0_0EXSyncFileDownloaderManifestSuccessBlock)(ABI40_0_0EXSyncManifest *update);
typedef void (^ABI40_0_0EXSyncFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI40_0_0EXSyncFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI40_0_0EXSyncConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI40_0_0EXSyncConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI40_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI40_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI40_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI40_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI40_0_0EXSyncDatabase *)database
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI40_0_0EXSyncFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI40_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

@end

NS_ASSUME_NONNULL_END
