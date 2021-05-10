// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXFileSystem/ABI41_0_0EXSessionTaskDelegate.h>

@interface ABI41_0_0EXSessionDownloadTaskDelegate : ABI41_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI41_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

