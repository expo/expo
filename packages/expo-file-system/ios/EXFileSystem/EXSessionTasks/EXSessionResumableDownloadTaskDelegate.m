// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionResumableDownloadTaskDelegate.h>

@interface EXSessionResumableDownloadTaskDelegate ()

@property (strong, nonatomic) NSString *taskUUID;
@property (weak, nonatomic) id<EXResumableTaskRegister> taskRegister;

@end


@implementation EXSessionResumableDownloadTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option
            withOnWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite
                       withUUID:(NSString *)uuid
      withResumableTaskRegister:(id<EXResumableTaskRegister>)taskRegister
{
  if (self = [super initWithResolve:resolve
                         withReject:reject
                   withLocalFileUrl:localFileUrl
                      withServerUrl:serverUrl
                      withMd5Option:md5Option
                withOnWriteCallback:onWrite]) {
    _taskUUID = uuid;
    _taskRegister = taskRegister;
  }
  
  return self;
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
    }
    
    [_taskRegister onTaskCompleted:_taskUUID];
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
  
  [super handleDidFinishDownloadingToURL:location withTask:downloadTask];
  [_taskRegister onTaskCompleted:_taskUUID];
}

@end
