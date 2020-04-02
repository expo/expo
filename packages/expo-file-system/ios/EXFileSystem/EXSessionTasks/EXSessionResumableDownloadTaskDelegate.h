// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>

typedef void (^EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface EXSessionResumableDownloadTaskDelegate : EXSessionDownloadTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
                           localFileUrl:(NSURL *)localFileUrl
                              serverUrl:(NSURL *)serverUrl
                              md5Option:(BOOL)md5Option
                        onWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite
                                   uuid:(NSString *)uuid;

@end
