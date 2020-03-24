// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>


@protocol EXResumableTaskRegister <NSObject>

- (void)onTaskCompleted:(NSString *)uuid;

@end

@interface EXSessionResumableDownloadTaskDelegate : EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject
                   localFileUrl:(NSURL *)localFileUrl
                      serverUrl:(NSURL *)serverUrl
                      md5Option:(BOOL)md5Option
                onWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite
                           uuid:(NSString *)uuid
          resumableTaskRegister:(id<EXResumableTaskRegister>)taskRegister;

@end
