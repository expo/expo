// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@interface EXSessionUploadTaskDelegate : EXSessionTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)taskRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject;

@end

