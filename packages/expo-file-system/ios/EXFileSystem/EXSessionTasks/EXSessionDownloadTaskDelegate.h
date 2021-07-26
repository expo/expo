// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionTaskDelegate.h>

@interface EXSessionDownloadTaskDelegate : EXSessionTaskDelegate

- (instancetype)initWithResolve:(EXPromiseResolveBlock)resolve
                         reject:(EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

