// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXFileSystem/ABI44_0_0EXSessionTaskDelegate.h>

@interface ABI44_0_0EXSessionDownloadTaskDelegate : ABI44_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI44_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

