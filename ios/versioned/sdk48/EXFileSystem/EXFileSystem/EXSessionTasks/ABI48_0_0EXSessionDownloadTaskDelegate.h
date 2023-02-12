// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXFileSystem/ABI48_0_0EXSessionTaskDelegate.h>

@interface ABI48_0_0EXSessionDownloadTaskDelegate : ABI48_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI48_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

