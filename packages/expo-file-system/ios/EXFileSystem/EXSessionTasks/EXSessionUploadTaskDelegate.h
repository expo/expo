// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@interface EXSessionUploadTaskDelegate : EXSessionTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
        withSessionTaskRegister:(id<EXSessionTaskRegister>)taskRegister;

@end

