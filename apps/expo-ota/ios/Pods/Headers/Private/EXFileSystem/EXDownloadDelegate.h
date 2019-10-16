// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXDownloadDelegate : NSObject <NSURLSessionDownloadDelegate>

typedef void (^EXDownloadDelegateOnWriteCallback)(NSURLSessionDownloadTask *task, int64_t bytesWritten, int64_t totalBytesWritten, int64_t totalBytesExpectedToWrite);

typedef void (^EXDownloadDelegateOnDownloadCallback)(NSURLSessionDownloadTask *task, NSURL *location);

typedef void (^EXDownloadDelegateOnErrorCallback)(NSError *error);


- (instancetype)initWithId:(NSString *)uuid
                   onWrite:(EXDownloadDelegateOnWriteCallback)onWrite
                onDownload:(EXDownloadDelegateOnDownloadCallback)onDownload
                   onError:(EXDownloadDelegateOnErrorCallback)onError;

@end
