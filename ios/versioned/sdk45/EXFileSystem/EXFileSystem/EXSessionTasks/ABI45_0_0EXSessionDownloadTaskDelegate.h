// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXFileSystem/ABI45_0_0EXSessionTaskDelegate.h>

@interface ABI45_0_0EXSessionDownloadTaskDelegate : ABI45_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI45_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI45_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

