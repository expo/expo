// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXFileSystem/ABI49_0_0EXSessionTaskDelegate.h>

@interface ABI49_0_0EXSessionDownloadTaskDelegate : ABI49_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI49_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

