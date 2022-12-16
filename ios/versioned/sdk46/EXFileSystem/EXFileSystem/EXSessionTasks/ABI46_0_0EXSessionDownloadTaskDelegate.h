// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXFileSystem/ABI46_0_0EXSessionTaskDelegate.h>

@interface ABI46_0_0EXSessionDownloadTaskDelegate : ABI46_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI46_0_0EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

