// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXFileSystem/ABI42_0_0EXSessionTaskDelegate.h>

@interface ABI42_0_0EXSessionDownloadTaskDelegate : ABI42_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI42_0_0UMPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

