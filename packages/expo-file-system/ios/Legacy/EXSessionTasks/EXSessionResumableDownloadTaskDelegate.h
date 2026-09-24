// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoFileSystem/EXSessionDownloadTaskDelegate.h>
#import <ExpoFileSystem/EXTaskHandlersManager.h>

typedef void (^EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);
typedef void (^EXDownloadDelegateOnFinishCallback)(NSString *uuid, BOOL succeeded);

@interface EXSessionResumableDownloadTaskDelegate : EXSessionDownloadTaskDelegate

- (nonnull instancetype)initWithResolve:(EXPromiseResolveBlock)resolve
                                 reject:(EXPromiseRejectBlock)reject
                               localUrl:(NSURL *)localUrl
                     shouldCalculateMd5:(BOOL)shouldCalculateMd5
                        onWriteCallback:(EXDownloadDelegateOnWriteCallback)onWriteCallback
                       onFinishCallback:(EXDownloadDelegateOnFinishCallback)onFinishCallback
                       resumableManager:(EXTaskHandlersManager *)manager
                                   uuid:(NSString *)uuid;

@end
