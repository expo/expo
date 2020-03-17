// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>


@protocol EXResumalbeTaskRegister <NSObject>

- (void)onTaskCompleted:(NSString *)uuid;

@end

@interface EXSessionResumableDownloadTaskDelegate : EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option
            withOnWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite
                       withUUID:(NSString *)uuid
      withResumalbeTaskRegister:(id<EXResumalbeTaskRegister>)taskRegister;

@end
