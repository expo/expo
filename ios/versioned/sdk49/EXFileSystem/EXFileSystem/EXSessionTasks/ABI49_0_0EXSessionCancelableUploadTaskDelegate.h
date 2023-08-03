// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXFileSystem/ABI49_0_0EXSessionUploadTaskDelegate.h>
#import <ABI49_0_0EXFileSystem/ABI49_0_0EXTaskHandlersManager.h>

typedef void (^ABI49_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI49_0_0EXSessionCancelableUploadTaskDelegate : ABI49_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI49_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI49_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI49_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
