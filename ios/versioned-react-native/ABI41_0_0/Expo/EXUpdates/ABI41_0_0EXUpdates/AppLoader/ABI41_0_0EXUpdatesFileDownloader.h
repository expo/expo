//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI41_0_0EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI41_0_0EXUpdatesFileDownloaderManifestSuccessBlock)(ABI41_0_0EXUpdatesUpdate *update);
typedef void (^ABI41_0_0EXUpdatesFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI41_0_0EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI41_0_0EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI41_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI41_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI41_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI41_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI41_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI41_0_0EXUpdatesDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(ABI41_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI41_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;

@end

NS_ASSUME_NONNULL_END
