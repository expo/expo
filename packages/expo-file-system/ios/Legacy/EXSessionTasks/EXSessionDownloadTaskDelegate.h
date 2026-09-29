// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoFileSystem/EXSessionTaskDelegate.h>

@interface EXSessionDownloadTaskDelegate : EXSessionTaskDelegate

- (nonnull instancetype)initWithResolve:(EXPromiseResolveBlock)resolve
                                 reject:(EXPromiseRejectBlock)reject
                               localUrl:(NSURL *)localUrl
                     shouldCalculateMd5:(BOOL)shouldCalculateMd5;

@end

