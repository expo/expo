// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>

@interface ABI44_0_0EXSessionTaskDelegate : NSObject

@property (nonatomic, strong, readonly) ABI44_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong, readonly) ABI44_0_0EXPromiseRejectBlock reject;

- (instancetype)initWithResolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI44_0_0EXPromiseRejectBlock)reject;

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location;

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error;

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
                                           didWriteData:(int64_t)bytesWritten
                                      totalBytesWritten:(int64_t)totalBytesWritten
                              totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite;

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data;

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task
                                didSendBodyData:(int64_t)bytesSent
                                 totalBytesSent:(int64_t)totalBytesSent
                       totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend;

- (NSDictionary *)parseServerResponse:(NSURLResponse *)response;

@end
