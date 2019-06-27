//  Copyright © 2018 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesFileDownloaderSuccessBlock)(NSData *data, NSURLResponse *response);
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

@end

NS_ASSUME_NONNULL_END
