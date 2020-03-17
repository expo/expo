// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>
#import <EXFileSystem/NSData+EXFileSystem.h>

@interface EXSessionDownloadTaskDelegate ()

@property (strong, nonatomic) NSURL *serverUrl;
@property (strong, nonatomic) NSURL *localFileUrl;
@property (nonatomic) BOOL md5Option;
@property (strong, nonatomic) EXDownloadDelegateOnWriteCallback onWrite;

@end

@implementation EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option
{
  if (self = [super initWithResolve:resolve withReject:reject]) {
    _serverUrl = serverUrl;
    _localFileUrl = localFileUrl;
    _md5Option = md5Option;
  }
  
  return self;
}

- (instancetype)initWithResolve:(UMPromiseResolveBlock)resolve
                     withReject:(UMPromiseRejectBlock)reject
               withLocalFileUrl:(NSURL *)localFileUrl
                  withServerUrl:(NSURL *)serverUrl
                  withMd5Option:(BOOL)md5Option
            withOnWriteCallback:(EXDownloadDelegateOnWriteCallback)onWrite;
{
  if (self = [self initWithResolve:resolve
                        withReject:reject
                  withLocalFileUrl:localFileUrl
                     withServerUrl:serverUrl
                     withMd5Option:md5Option]) {
    _onWrite = onWrite;
  }
  
  return self;
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  if (_onWrite) {
    _onWrite(downloadTask, bytesWritten, totalBytesWritten, totalBytesExpectedToWrite);
  }
}
  

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
  [self handleDidFinishDownloadingToURL:location withTask:downloadTask];
}

- (void)handleDidFinishDownloadingToURL:(NSURL *)location withTask:(NSURLSessionDownloadTask *)downloadTask
{
  NSError *error;
   NSFileManager *fileManager = [NSFileManager defaultManager];
   if ([fileManager fileExistsAtPath:_localFileUrl.path]) {
     [fileManager removeItemAtURL:_localFileUrl error:&error];
   }
   
   [fileManager moveItemAtURL:location toURL:_localFileUrl error:&error];
   if (error) {
     self.reject(@"E_UNABLE_TO_SAVE",
           [NSString stringWithFormat:@"Unable to save file to local URI. '%@'", error.description],
           error);
     return;
   }
   
   NSMutableDictionary *result = [self parseServerResponse:downloadTask.response];
   result[@"uri"] = _localFileUrl.absoluteString;
   if (self.md5Option) {
     NSData *data = [NSData dataWithContentsOfURL:_localFileUrl];
     result[@"md5"] = [data md5String];
   }
   
   self.resolve(result);
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  if([error description] != nil) {
    [self handleDidCompleteWithError:error];
  }
}

- (void)handleDidCompleteWithError:(NSError *)error
{
  // "cancelled" description when paused.  Don't throw.
  if ([error.localizedDescription isEqualToString:@"cancelled"]) {
    self.resolve([NSNull null]);
  } else {
    self.reject(@"E_UNABLE_TO_DOWNLOAD",
           [NSString stringWithFormat:@"Unable to download file. %@", error.description],
           error);
  }
}

@end
