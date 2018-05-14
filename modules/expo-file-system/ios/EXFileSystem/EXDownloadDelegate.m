// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXDownloadDelegate.h>

@interface EXDownloadDelegate ()
  
@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) EXDownloadDelegateOnWriteCallback onWrite;
@property (nonatomic, strong) EXDownloadDelegateOnDownloadCallback onDownload;
@property (nonatomic, strong) EXDownloadDelegateOnErrorCallback onError;
  
@end

@implementation EXDownloadDelegate
  
- (instancetype)initWithId:(NSString *)uuid
                   onWrite:(nullable EXDownloadDelegateOnWriteCallback)onWrite
                onDownload:(nullable EXDownloadDelegateOnDownloadCallback)onDownload
                   onError:(nonnull EXDownloadDelegateOnErrorCallback)onError;
{
  if (self = [super init]) {
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
