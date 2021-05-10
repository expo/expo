// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXFileSystem/ABI39_0_0EXSessionTaskDelegate.h>

@interface ABI39_0_0EXSessionDownloadTaskDelegate : ABI39_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI39_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

