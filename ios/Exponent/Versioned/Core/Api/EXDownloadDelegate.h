// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXDownloadDelegate : NSObject <NSURLSessionDownloadDelegate>
  
- (instancetype)initWithId:(NSString *)uuid
                   onWrite:(void (^)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite))onWrite
                onDownload:(void (^)(NSURLSessionDownloadTask *task, NSURL *location))onDownload
                   onError:(void (^)(NSError *error))onError;

@end
