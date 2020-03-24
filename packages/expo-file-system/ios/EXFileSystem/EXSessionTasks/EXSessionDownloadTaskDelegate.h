// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

typedef void (^EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface EXSessionDownloadTaskDelegate : EXSessionTaskDelegate
            
- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject
                   localFileUrl:(NSURL *)localFileUrl
                      serverUrl:(NSURL *)serverUrl
                      md5Option:(BOOL)md5Option;

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject
                   localFileUrl:(NSURL *)localFileUrl
                      serverUrl:(NSURL *)serverUrl
                      md5Option:(BOOL)md5Option
                onWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite;

- (void)handleDidFinishDownloadingToURL:(NSURL *)location task:(NSURLSessionDownloadTask *)downloadTask;

@end
