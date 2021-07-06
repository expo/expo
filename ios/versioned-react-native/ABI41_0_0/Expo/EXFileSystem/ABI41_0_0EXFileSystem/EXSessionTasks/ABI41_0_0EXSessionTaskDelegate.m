// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXFileSystem/ABI41_0_0EXSessionTaskDelegate.h>

@implementation ABI41_0_0EXSessionTaskDelegate

- (instancetype)initWithResolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI41_0_0UMPromiseRejectBlock)reject
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
    @"mimeType": ABI41_0_0UMNullIfNil([httpResponse MIMEType])
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

@end
