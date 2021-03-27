//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI39_0_0EXSyncFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI39_0_0EXSyncFileDownloaderManifestSuccessBlock)(ABI39_0_0EXSyncManifest *update);
typedef void (^ABI39_0_0EXSyncFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI39_0_0EXSyncFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI39_0_0EXSyncConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI39_0_0EXSyncConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI39_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI39_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI39_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI39_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI39_0_0EXSyncDatabase *)database
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI39_0_0EXSyncFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI39_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

@end

NS_ASSUME_NONNULL_END
