// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFileSystem/ABI40_0_0EXSessionTaskDelegate.h>

@interface ABI40_0_0EXSessionDownloadTaskDelegate : ABI40_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI40_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

