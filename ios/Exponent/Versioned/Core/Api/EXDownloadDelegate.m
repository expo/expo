// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDownloadDelegate.h"

@interface EXDownloadDelegate()
  
@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) void (^onWrite)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);
@property (nonatomic, strong) void (^onDownload)(NSURLSessionDownloadTask *task, NSURL *location);
@property (nonatomic, strong) void (^onError)(NSError *error);
  
@end

@implementation EXDownloadDelegate
  
- (instancetype)initWithId:(NSString *)uuid
                   onWrite:(nullable void (^)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite))onWrite
                onDownload:(nullable void (^)(NSURLSessionDownloadTask *task, NSURL *location))onDownload
                   onError:(nonnull void (^)(NSError *error))onError;
{
  if ((self = [super init])) {
    _uuid = uuid;
    _onWrite = onWrite;
    _onDownload = onDownload;
    _onError = onError;
  }
  return self;
}
  
# pragma mark - NSURLSessionDownloadDelegate Methods
  
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
  if (_onWrite) {
    _onWrite(downloadTask, bytesWritten, totalBytesWritten, totalBytesExpectedToWrite);
  }
}
  
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
  if (_onDownload) {
    _onDownload(downloadTask, location);
  }
}
  
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
  if([error description] != nil) {
    if (_onError) {
      _onError(error);
    }
  }
}

@end
