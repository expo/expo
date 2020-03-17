// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

typedef void (^EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

@interface EXSessionDownloadTaskDelegate : EXSessionTaskDelegate
            
- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option;

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option
            withOnWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite;

- (void)handleDidCompleteWithError:(NSError *)error;

- (void)handleDidFinishDownloadingToURL:(NSURL *)location withTask:(NSURLSessionDownloadTask *)downloadTask;

@end
