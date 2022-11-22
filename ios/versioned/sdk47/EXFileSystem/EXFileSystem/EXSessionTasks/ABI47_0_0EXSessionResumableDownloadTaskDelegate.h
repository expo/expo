// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXFileSystem/ABI47_0_0EXSessionDownloadTaskDelegate.h>
#import <ABI47_0_0EXFileSystem/ABI47_0_0EXTaskHandlersManager.h>

typedef void (^ABI47_0_0EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface ABI47_0_0EXSessionResumableDownloadTaskDelegate : ABI47_0_0EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI47_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5
                onWriteCallback:(ABI47_0_0EXDownloadDelegateOnWriteCallback)onWriteCallback
               resumableManager:(ABI47_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
