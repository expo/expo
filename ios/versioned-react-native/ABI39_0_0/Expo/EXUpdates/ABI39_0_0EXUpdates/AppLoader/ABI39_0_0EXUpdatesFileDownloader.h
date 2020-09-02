//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI39_0_0EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI39_0_0EXUpdatesFileDownloaderManifestSuccessBlock)(ABI39_0_0EXUpdatesUpdate *update);
typedef void (^ABI39_0_0EXUpdatesFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI39_0_0EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI39_0_0EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI39_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI39_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI39_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI39_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI39_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI39_0_0EXUpdatesDatabase *)database
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI39_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI39_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

@end

NS_ASSUME_NONNULL_END
