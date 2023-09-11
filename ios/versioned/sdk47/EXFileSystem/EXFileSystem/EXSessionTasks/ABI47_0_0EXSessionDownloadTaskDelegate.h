// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXFileSystem/ABI47_0_0EXSessionTaskDelegate.h>

@interface ABI47_0_0EXSessionDownloadTaskDelegate : ABI47_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI47_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

