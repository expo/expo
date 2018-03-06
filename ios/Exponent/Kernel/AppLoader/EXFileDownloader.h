// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

NS_ASSUME_NONNULL_BEGIN

extern NSString * const EXNetworkErrorDomain;
extern NSTimeInterval const EXFileDownloaderDefaultTimeoutInterval;

typedef void (^EXFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^EXFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface EXFileDownloader : NSObject

@property (nonatomic, strong, nullable) NSString *abiVersion;
@property (nonatomic, strong) NSURLSessionConfiguration *urlSessionConfiguration; // default is `defaultSessionConfiguration`
@property (nonatomic, assign) NSTimeInterval timeoutInterval; // default is NSURLRequest's default of 60 seconds.
@property (nonatomic, strong, nullable) NSString *releaseChannel;

- (void)downloadFileFromURL:(NSURL *)url
               successBlock:(EXFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXFileDownloaderErrorBlock)errorBlock;

- (void)setHTTPHeaderFields:(NSMutableURLRequest *)request;

@end

NS_ASSUME_NONNULL_END
