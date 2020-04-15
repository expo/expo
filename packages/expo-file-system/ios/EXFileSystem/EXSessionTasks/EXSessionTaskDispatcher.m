// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDispatcher.h>
#import <EXFileSystem/EXSessionResumableDownloadTaskDelegate.h>

@interface EXSessionTaskDispatcher ()

@property (nonatomic, strong) NSMutableDictionary<NSURLSessionTask *, EXSessionTaskDelegate *> *tasks;
@property (nonatomic) BOOL isActive;

@end

@implementation EXSessionTaskDispatcher

- (instancetype)init
{
  if (self = [super init]) {
    _tasks = [NSMutableDictionary dictionary];
    _isActive = true;
  }
  return self;
}

#pragma mark - public methods

- (void)registerTaskDelegate:(EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task
{
  _tasks[task] = delegate;
}

- (void)unregisterTaskDelegate:(NSURLSessionTask *)task
{
  EXSessionTaskDelegate *delegate = _tasks[task];
  [self _unregisterIfResumableTaskDelegate:delegate];
  [_tasks removeObjectForKey:task];
}

- (void)deactivate
{
  _isActive = false;
}

#pragma mark - helpers

- (void)_unregisterIfResumableTaskDelegate:(EXSessionTaskDelegate *)taskDelegate
{
  if ([taskDelegate isKindOfClass:[EXSessionResumableDownloadTaskDelegate class]]) {
    EXSessionResumableDownloadTaskDelegate *exResumableTask = (EXSessionResumableDownloadTaskDelegate *)taskDelegate;
    [exResumableTask invalid];
  }
}

#pragma mark - dispatcher

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  if (_isActive) {
    EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    if (exTask) {
      [exTask URLSession:session downloadTask:downloadTask didFinishDownloadingToURL:location];
      [_tasks removeObjectForKey:downloadTask];
      [self _unregisterIfResumableTaskDelegate:exTask];
    }
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (_isActive) {
    EXSessionTaskDelegate *exTask = _tasks[task];
    if (exTask) {
      [exTask URLSession:session task:task didCompleteWithError:error];
      [_tasks removeObjectForKey:task];
      [self _unregisterIfResumableTaskDelegate:exTask];
    }
  }
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
                                           didWriteData:(int64_t)bytesWritten
                                      totalBytesWritten:(int64_t)totalBytesWritten
                              totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  if (_isActive) {
    EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    [exTask URLSession:session downloadTask:downloadTask didWriteData:bytesWritten totalBytesWritten:totalBytesWritten totalBytesExpectedToWrite:totalBytesExpectedToWrite];
  }
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  if (_isActive) {
    EXSessionTaskDelegate *exTask = _tasks[dataTask];
    [exTask URLSession:session dataTask:dataTask didReceiveData:data];
  }
}

@end
