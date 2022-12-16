// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXFileSystem/ABI46_0_0EXSessionUploadTaskDelegate.h>
#import <ABI46_0_0EXFileSystem/ABI46_0_0EXTaskHandlersManager.h>

typedef void (^ABI46_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI46_0_0EXSessionCancelableUploadTaskDelegate : ABI46_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI46_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI46_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI46_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
