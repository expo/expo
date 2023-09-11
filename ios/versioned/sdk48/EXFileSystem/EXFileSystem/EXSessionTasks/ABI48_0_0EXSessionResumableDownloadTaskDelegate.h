// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXFileSystem/ABI48_0_0EXSessionDownloadTaskDelegate.h>
#import <ABI48_0_0EXFileSystem/ABI48_0_0EXTaskHandlersManager.h>

typedef void (^ABI48_0_0EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface ABI48_0_0EXSessionResumableDownloadTaskDelegate : ABI48_0_0EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI48_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5
                onWriteCallback:(ABI48_0_0EXDownloadDelegateOnWriteCallback)onWriteCallback
               resumableManager:(ABI48_0_0EXTaskHandlersManager *)manager
                           uuid:(NSString *)uuid;

@end
