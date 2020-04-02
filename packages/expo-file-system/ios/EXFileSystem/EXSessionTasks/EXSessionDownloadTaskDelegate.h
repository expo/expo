// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@interface EXSessionDownloadTaskDelegate : EXSessionTaskDelegate
            
- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
                           localFileUrl:(NSURL *)localFileUrl
                              serverUrl:(NSURL *)serverUrl
                              md5Option:(BOOL)md5Option;

- (void)handleDidFinishDownloadingToURL:(NSURL *)location task:(NSURLSessionDownloadTask *)downloadTask;

@end
