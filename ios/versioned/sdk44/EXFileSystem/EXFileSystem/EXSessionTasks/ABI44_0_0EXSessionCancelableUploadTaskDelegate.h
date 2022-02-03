// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXFileSystem/ABI44_0_0EXSessionUploadTaskDelegate.h>
#import <ABI44_0_0EXFileSystem/ABI44_0_0EXTaskHandlersManager.h>

typedef void (^ABI44_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI44_0_0EXSessionCancelableUploadTaskDelegate : ABI44_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI44_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI44_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI44_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
