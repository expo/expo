// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXFileSystem/ABI45_0_0EXSessionUploadTaskDelegate.h>
#import <ABI45_0_0EXFileSystem/ABI45_0_0EXTaskHandlersManager.h>

typedef void (^ABI45_0_0EXUploadDelegateOnSendCallback)(NSURLSessionUploadTask *task, int64_t bytesSent, int64_t totalBytesSent, int64_t totalBytesExpectedToSend);

@interface ABI45_0_0EXSessionCancelableUploadTaskDelegate : ABI45_0_0EXSessionUploadTaskDelegate

- (instancetype)initWithResolve:(ABI45_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI45_0_0EXPromiseRejectBlock)reject
                 onSendCallback:(ABI45_0_0EXUploadDelegateOnSendCallback)onSendCallback
               resumableManager:(ABI45_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
