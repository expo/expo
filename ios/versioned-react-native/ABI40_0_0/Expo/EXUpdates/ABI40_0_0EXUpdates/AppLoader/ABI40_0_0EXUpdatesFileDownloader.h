//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI40_0_0EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI40_0_0EXUpdatesFileDownloaderManifestSuccessBlock)(ABI40_0_0EXUpdatesUpdate *update);
typedef void (^ABI40_0_0EXUpdatesFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface ABI40_0_0EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI40_0_0EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI40_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(ABI40_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI40_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(ABI40_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI40_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI40_0_0EXUpdatesDatabase *)database
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(ABI40_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI40_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

@end

NS_ASSUME_NONNULL_END
