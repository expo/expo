//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)(ABI44_0_0EXUpdatesUpdate *update);
typedef void (^ABI44_0_0EXUpdatesFileDownloaderErrorBlock)(NSError *error);

@interface ABI44_0_0EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI44_0_0EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI44_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI44_0_0EXUpdatesDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * Get extra (stateful) headers to pass into `downloadManifestFromURL:`
 * Must be called on the database queue
 */
+ (NSDictionary *)extraHeadersWithDatabase:(ABI44_0_0EXUpdatesDatabase *)database
                                    config:(ABI44_0_0EXUpdatesConfig *)config
                            launchedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate
                            embeddedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)embeddedUpdate;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;
- (NSURLRequest *)createGenericRequestWithURL:(NSURL *)url extraHeaders:(NSDictionary *)extraHeaders;
- (void)parseManifestResponse:(NSHTTPURLResponse *)httpResponse
                     withData:(NSData *)data
                     database:(ABI44_0_0EXUpdatesDatabase *)database
                 successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
