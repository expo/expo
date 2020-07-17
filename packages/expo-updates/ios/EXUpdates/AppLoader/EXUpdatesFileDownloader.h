//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^EXUpdatesFileDownloaderManifestSuccessBlock)(EXUpdatesUpdate *update);
typedef void (^EXUpdatesFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface EXUpdatesFileDownloader : NSObject

- (instancetype)initWithURLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                     withConfig:(EXUpdatesConfig *)config
                       database:(EXUpdatesDatabase *)database
                 cacheDirectory:(NSURL *)cacheDirectory
                   successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

@end

NS_ASSUME_NONNULL_END
