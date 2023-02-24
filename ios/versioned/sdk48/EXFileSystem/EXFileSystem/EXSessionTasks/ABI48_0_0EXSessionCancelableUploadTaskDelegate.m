// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXFileSystem/ABI48_0_0EXSessionCancelableUploadTaskDelegate.h>

@interface ABI48_0_0EXSessionCancelableUploadTaskDelegate ()

@property (strong, nonatomic, readonly) ABI48_0_0EXUploadDelegateOnSendCallback onSendCallback;
@property (weak, nonatomic) ABI48_0_0EXTaskHandlersManager *manager;
@property (strong, nonatomic) NSString *uuid;

@end

@implementation ABI48_0_0EXSessionCancelableUploadTaskDelegate

- (instancetype)initWithResolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI48_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI48_0_0EXUploadDelegateOnSendCallback)onSendCallback
                resumableManager:(ABI48_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;
{
  if (self = [super initWithResolve:resolve
                             reject:reject]) {
    _onSendCallback = onSendCallback;
    _manager = manager;
    _uuid = uuid;
  }
  return self;
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error) {
    // The task was paused by us. So, we shouldn't throw.
    if (error.code == NSURLErrorCancelled) {
      self.resolve([NSNull null]);
      [_manager unregisterTask:_uuid];
      return;
    }
  }

  [super URLSession:session task:task didCompleteWithError:error];
  [_manager unregisterTask:_uuid];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task
                                didSendBodyData:(int64_t)bytesSent
                                 totalBytesSent:(int64_t)totalBytesSent
                       totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  if (_onSendCallback && bytesSent > 0) {
    _onSendCallback(task, bytesSent, totalBytesSent, totalBytesExpectedToSend);
  }
}

@end
