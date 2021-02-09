// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFileSystem/ABI40_0_0EXSessionDownloadTaskDelegate.h>
#import <ABI40_0_0EXFileSystem/ABI40_0_0EXResumablesManager.h>

typedef void (^ABI40_0_0EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface ABI40_0_0EXSessionResumableDownloadTaskDelegate : ABI40_0_0EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI40_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5
                onWriteCallback:(ABI40_0_0EXDownloadDelegateOnWriteCallback)onWriteCallback
               resumableManager:(ABI40_0_0EXResumablesManager *)manager
                           uuid:(NSString *)uuid;

@end
