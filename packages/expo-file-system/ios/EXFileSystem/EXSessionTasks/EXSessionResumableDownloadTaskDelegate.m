// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionResumableDownloadTaskDelegate.h>

@interface EXSessionResumableDownloadTaskDelegate ()

@property (strong, nonatomic, readonly) EXDownloadDelegateOnWriteCallback onWrite;
@property (strong, nonatomic, readonly) NSString *uuid;

@end

@implementation EXSessionResumableDownloadTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
                           localFileUrl:(NSURL *)localFileUrl
                              serverUrl:(NSURL *)serverUrl
                              md5Option:(BOOL)md5Option
                        onWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite
                                   uuid:(NSString *)uuid;
{
  if (self = [self initWithSessionRegister:sessionRegister
                                   resolve:resolve
                                    reject:reject
                              localFileUrl:localFileUrl
                                 serverUrl:serverUrl
                                 md5Option:md5Option]) {
    _onWrite = onWrite;
    _uuid = uuid;
  }
  
  return self;
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  if (_onWrite) {
    _onWrite(downloadTask, bytesWritten, totalBytesWritten, totalBytesExpectedToWrite);
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error) {
    // The task was paused by us. So, we shouldn't throw.
    if (error.code == NSURLErrorCancelled) {
      self.resolve([NSNull null]);
    } else {
      self.reject(@"ERR_FILE_SYSTEM_UNABLE_TO_DOWNLOAD",
                  [NSString stringWithFormat:@"Unable to download file. %@", error.description],
                  error);
      [self.sessionRegister unregister:session uuid:_uuid];
    }
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  [super handleDidFinishDownloadingToURL:location task:downloadTask];
  [self.sessionRegister unregister:session uuid:_uuid];
}

@end
