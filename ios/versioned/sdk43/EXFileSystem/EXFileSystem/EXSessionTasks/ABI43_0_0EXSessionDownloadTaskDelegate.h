// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXFileSystem/ABI43_0_0EXSessionTaskDelegate.h>

@interface ABI43_0_0EXSessionDownloadTaskDelegate : ABI43_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI43_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

