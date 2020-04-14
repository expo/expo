// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFileSystem/EXSessionTaskDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSessionTaskDispatcher : NSObject <NSURLSessionDelegate>

- (void)registerTaskDelegate:(EXSessionTaskDelegate *)delegate forTask:(NSURLSessionTask *)task;

- (void)registerResumableDownloadTask:(NSURLSessionDownloadTask *)task uuid:(NSString *)uuid;

- (NSURLSessionDownloadTask * _Nullable)resumableDownload:(NSString *)uuid;

- (void)removeResumableDownload:(NSString *)uuid;

- (void)deactivate;

@end

NS_ASSUME_NONNULL_END
