//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI41_0_0EXSyncFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI41_0_0EXSyncFileDownloaderManifestSuccessBlock)(ABI41_0_0EXSyncManifest *update);
typedef void (^ABI41_0_0EXSyncFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI41_0_0EXSyncFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI41_0_0EXSyncConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI41_0_0EXSyncConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI41_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI41_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI41_0_0EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI41_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI41_0_0EXSyncDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(ABI41_0_0EXSyncFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI41_0_0EXSyncFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;

@end

NS_ASSUME_NONNULL_END
