// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXFileSystem/ABI38_0_0EXSessionTaskDelegate.h>

@interface ABI38_0_0EXSessionDownloadTaskDelegate : ABI38_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI38_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

