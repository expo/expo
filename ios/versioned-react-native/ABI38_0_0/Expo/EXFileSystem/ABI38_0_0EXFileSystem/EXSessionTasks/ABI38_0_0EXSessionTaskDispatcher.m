// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXFileSystem/ABI38_0_0EXSessionTaskDispatcher.h>
#import <ABI38_0_0EXFileSystem/ABI38_0_0EXSessionResumableDownloadTaskDelegate.h>

@interface ABI38_0_0EXSessionTaskDispatcher ()

@property (nonatomic, strong) NSMutableDictionary<NSURLSessionTask *, ABI38_0_0EXSessionTaskDelegate *> *tasks;
@property (nonatomic) BOOL isActive;

@end

@implementation ABI38_0_0EXSessionTaskDispatcher

- (instancetype)init
{
  if (self = [super init]) {
    _tasks = [NSMutableDictionary dictionary];
    _isActive = true;
  }
  return self;
}

#pragma mark - public methods

- (void)registerTaskDelegate:(ABI38_0_0EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task
{
  _tasks[task] = delegate;
}

- (void)deactivate
{
  _isActive = false;
}

#pragma mark - dispatcher

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  if (_isActive) {
    ABI38_0_0EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    if (exTask) {
      [exTask URLSession:session downloadTask:downloadTask didFinishDownloadingToURL:location];
      [_tasks removeObjectForKey:downloadTask];
    }
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (_isActive) {
    ABI38_0_0EXSessionTaskDelegate *exTask = _tasks[task];
    if (exTask) {
      [exTask URLSession:session task:task didCompleteWithError:error];
      [_tasks removeObjectForKey:task];
    }
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
                                           didWriteData:(int64_t)bytesWritten
                                      totalBytesWritten:(int64_t)totalBytesWritten
                              totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  if (_isActive) {
    ABI38_0_0EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    [exTask URLSession:session downloadTask:downloadTask didWriteData:bytesWritten totalBytesWritten:totalBytesWritten totalBytesExpectedToWrite:totalBytesExpectedToWrite];
  }
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  if (_isActive) {
    ABI38_0_0EXSessionTaskDelegate *exTask = _tasks[dataTask];
    [exTask URLSession:session dataTask:dataTask didReceiveData:data];
  }
}

@end
