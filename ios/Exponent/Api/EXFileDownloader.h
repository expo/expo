// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

NS_ASSUME_NONNULL_BEGIN

extern NSString * const EXNetworkErrorDomain;

typedef void (^EXFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
typedef void (^EXFileDownloaderErrorBlock)(NSError *error, NSURLResponse *response);

@interface EXFileDownloader : NSObject

@property (nonatomic, strong, nullable) NSString *abiVersion;
@property (nonatomic, strong) NSURLCache *urlCache;

- (void)downloadFileFromURL:(NSURL *)url
               successBlock:(EXFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXFileDownloaderErrorBlock)errorBlock;

- (void)setHTTPHeaderFields:(NSMutableURLRequest *)request;

@end

NS_ASSUME_NONNULL_END
