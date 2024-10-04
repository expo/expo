// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXFileSystem/ABI42_0_0EXSessionTaskDispatcher.h>
#import <ABI42_0_0EXFileSystem/ABI42_0_0EXSessionResumableDownloadTaskDelegate.h>

@interface ABI42_0_0EXSessionTaskDispatcher ()

@property (nonatomic, strong) NSMutableDictionary<NSURLSessionTask *, ABI42_0_0EXSessionTaskDelegate *> *tasks;
@property (nonatomic) BOOL isActive;
@property (nonatomic, weak) id<ABI42_0_0EXSessionHandler> sessionHandler;

@end

@implementation ABI42_0_0EXSessionTaskDispatcher

- (instancetype)initWithSessionHandler:(id<ABI42_0_0EXSessionHandler>)sessionHandler;
{
  if (self = [super init]) {
    _tasks = [NSMutableDictionary dictionary];
    _isActive = true;
    _sessionHandler = sessionHandler;
  }
  return self;
}

#pragma mark - public methods

- (void)registerTaskDelegate:(ABI42_0_0EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task
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
    ABI42_0_0EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    if (exTask) {
      [exTask URLSession:session downloadTask:downloadTask didFinishDownloadingToURL:location];
      [_tasks removeObjectForKey:downloadTask];
    }
  }
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (_isActive) {
    ABI42_0_0EXSessionTaskDelegate *exTask = _tasks[task];
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
    ABI42_0_0EXSessionTaskDelegate *exTask = _tasks[downloadTask];
    [exTask URLSession:session downloadTask:downloadTask didWriteData:bytesWritten totalBytesWritten:totalBytesWritten totalBytesExpectedToWrite:totalBytesExpectedToWrite];
  }
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
  if (_isActive) {
    ABI42_0_0EXSessionTaskDelegate *exTask = _tasks[dataTask];
    [exTask URLSession:session dataTask:dataTask didReceiveData:data];
  }
}

- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session {
  [_sessionHandler invokeCompletionHandlerForSessionIdentifier:session.configuration.identifier];
}

@end
