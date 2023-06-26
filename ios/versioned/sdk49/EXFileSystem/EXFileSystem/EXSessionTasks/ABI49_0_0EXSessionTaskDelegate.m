// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXFileSystem/ABI49_0_0EXSessionTaskDelegate.h>

@implementation ABI49_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI49_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI49_0_0EXPromiseRejectBlock)reject
{
  if (self = [super init]) {
    _resolve = resolve;
    _reject = reject;
  }
  return self;
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if (error) {
    self.reject(@"ERR_FILESYSTEM_CANNOT_DOWNLOAD",
                [NSString stringWithFormat:@"Unable to download file: %@", error.description],
                error);
  }
}

- (NSDictionary *)parseServerResponse:(NSURLResponse *)response
{
  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
  return @{
    @"status": @([httpResponse statusCode]),
    @"headers": [httpResponse allHeaderFields],
    @"mimeType": ABI49_0_0EXNullIfNil([httpResponse MIMEType])
  };
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
                                           didWriteData:(int64_t)bytesWritten
                                      totalBytesWritten:(int64_t)totalBytesWritten
                              totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task
                                didSendBodyData:(int64_t)bytesSent
                                 totalBytesSent:(int64_t)totalBytesSent
                       totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
}

@end
