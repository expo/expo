//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@class EXUpdatesUpdateResponse;

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^EXUpdatesFileDownloaderWithHashSuccessBlock)(NSData *data, NSURLResponse *response, NSString *base64URLEncodedSHA256Hash);

typedef void (^EXUpdatesFileDownloaderRemoteUpdateDownloadSuccessBlock)(EXUpdatesUpdateResponse *updateResponse);
typedef void (^EXUpdatesFileDownloaderRemoteUpdateDownloadErrorBlock)(NSError *error);

typedef void (^EXUpdatesFileDownloaderErrorBlock)(NSError *error);

@interface EXUpdatesFileDownloader : NSObject

- (instancetype)initWithUpdatesConfig:(EXUpdatesConfig *)updatesConfig;
- (instancetype)initWithUpdatesConfig:(EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration;

- (void)downloadDataFromURL:(NSURL *)url
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadFileFromURL:(NSURL *)url
              verifyingHash:(nullable NSString *)expectedBase64URLEncodedSHA256Hash
                     toPath:(NSString *)destinationPath
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(EXUpdatesFileDownloaderWithHashSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock;

- (void)downloadRemoteUpdateFromURL:(NSURL *)url
                       withDatabase:(EXUpdatesDatabase *)database
                       extraHeaders:(nullable NSDictionary *)extraHeaders
                       successBlock:(EXUpdatesFileDownloaderRemoteUpdateDownloadSuccessBlock)successBlock
                         errorBlock:(EXUpdatesFileDownloaderRemoteUpdateDownloadErrorBlock)errorBlock;

+ (dispatch_queue_t)assetFilesQueue;

/**
 * Get extra (stateful) headers to pass into `downloadManifestFromURL:`
 * Must be called on the database queue
 */
+ (NSDictionary *)extraHeadersWithDatabase:(EXUpdatesDatabase *)database
                                    config:(EXUpdatesConfig *)config
                            launchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
                            embeddedUpdate:(nullable EXUpdatesUpdate *)embeddedUpdate;

/**
 * For test purposes; shouldn't be needed in application code
 */
- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders;
- (NSURLRequest *)createGenericRequestWithURL:(NSURL *)url extraHeaders:(NSDictionary *)extraHeaders;
- (void)parseManifestResponse:(NSHTTPURLResponse *)httpResponse
                     withData:(NSData *)data
                     database:(EXUpdatesDatabase *)database
                 successBlock:(EXUpdatesFileDownloaderRemoteUpdateDownloadSuccessBlock)successBlock
                   errorBlock:(EXUpdatesFileDownloaderRemoteUpdateDownloadErrorBlock)errorBlock;

@end

NS_ASSUME_NONNULL_END
