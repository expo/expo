// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXFileSystem/ABI47_0_0EXSessionUploadTaskDelegate.h>
#import <ABI47_0_0EXFileSystem/ABI47_0_0EXTaskHandlersManager.h>

typedef void (^ABI47_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI47_0_0EXSessionCancelableUploadTaskDelegate : ABI47_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI47_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI47_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI47_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
