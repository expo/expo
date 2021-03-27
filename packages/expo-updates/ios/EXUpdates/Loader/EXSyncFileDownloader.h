//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXSyncFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^EXSyncFileDownloaderManifestSuccessBlock)(EXSyncManifest *update);
typedef void (^EXSyncFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface EXSyncFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(EXSyncConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(EXSyncConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(EXSyncFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXSyncFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(EXSyncDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(EXSyncFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(EXSyncFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;

@end

NS_ASSUME_NONNULL_END
