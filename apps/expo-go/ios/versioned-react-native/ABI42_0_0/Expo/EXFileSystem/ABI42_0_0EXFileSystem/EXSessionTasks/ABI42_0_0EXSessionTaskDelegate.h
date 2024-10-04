// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>

@interface ABI42_0_0EXSessionTaskDelegate : NSObject

@property (nonatomic, strong, readonly) ABI42_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong, readonly) ABI42_0_0UMPromiseRejectBlock reject;

- (instancetype)initWithResolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI42_0_0UMPromiseRejectBlock)reject;

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location;

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error;

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
                                           didWriteData:(int64_t)bytesWritten
                                      totalBytesWritten:(int64_t)totalBytesWritten
                              totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite;

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data;

- (NSDictionary *)parseServerResponse:(NSURLResponse *)response;

@end
