//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI48_0_0EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^ABI48_0_0EXUpdatesFileDownloaderWithHashSuccessBlock)(NSData *data, NSURLResponse *response, NSString *base64URLEncodedSHA256Hash);
typedef void (^ABI48_0_0EXUpdatesFileDownloaderManifestSuccessBlock)(ABI48_0_0EXUpdatesUpdate *update);
typedef void (^ABI48_0_0EXUpdatesFileDownloaderErrorBlock)(NSError *error);

@interface ABI48_0_0EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(ABI48_0_0EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(ABI48_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI48_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI48_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
              verifyingHash:(nullable NSString *)expectedBase64URLEncodedSHA256Hash
                     toPath:(NSString *)destinationPath
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI48_0_0EXUpdatesFileDownloaderWithHashSuccessBlock)successBlock
                 errorBlock:(ABI48_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI48_0_0EXUpdatesDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(ABI48_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI48_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * Get extra (stateful) headers to pass into `downloadManifestFromURL:`
 * Must be called on the database queue
 */
+ (NSDictionary *)extraHeadersWithDatabase:(ABI48_0_0EXUpdatesDatabase *)database
                                    config:(ABI48_0_0EXUpdatesConfig *)config
                            launchedUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)launchedUpdate
                            embeddedUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)embeddedUpdate;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;
- (NSURLRequest *)createGenericRequestWithURL:(NSURL *)url extraHeaders:(NSDictionary *)extraHeaders;
- (void)parseManifestResponse:(NSHTTPURLResponse *)httpResponse
                     withData:(NSData *)data
                     database:(ABI48_0_0EXUpdatesDatabase *)database
                 successBlock:(ABI48_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(ABI48_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
