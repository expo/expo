// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXFileSystem/ABI48_0_0EXSessionUploadTaskDelegate.h>
#import <ABI48_0_0EXFileSystem/ABI48_0_0EXTaskHandlersManager.h>

typedef void (^ABI48_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI48_0_0EXSessionCancelableUploadTaskDelegate : ABI48_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI48_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI48_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI48_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
