// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>
#import <EXFileSystem/NSData+EXFileSystem.h>

@interface EXSessionDownloadTaskDelegate ()

@property (strong, nonatomic) NSURL *serverUrl;
@property (strong, nonatomic) NSURL *localFileUrl;
@property (nonatomic) BOOL md5Option;

@end

@implementation EXSessionDownloadTaskDelegate

- (instancetype)initWithSessionRegister:(id<EXSessionRegister>)sessionRegister
                                resolve:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject
                           localFileUrl:(NSURL *)localFileUrl
                              serverUrl:(NSURL *)serverUrl
                              md5Option:(BOOL)md5Option;
{
  if (self = [super initWithSessionRegister:sessionRegister resolve:resolve reject:reject]) {
    _serverUrl = serverUrl;
    _localFileUrl = localFileUrl;
    _md5Option = md5Option;
  }
  
  return self;
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  [self handleDidFinishDownloadingToURL:location task:downloadTask];
  [self.sessionRegister unregister:session];
}

- (void)handleDidFinishDownloadingToURL:(NSURL *)location task:(NSURLSessionDownloadTask *)downloadTask
{
  NSError *error;
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:_localFileUrl.path]) {
    [fileManager removeItemAtURL:_localFileUrl error:&error];
  }

  [fileManager moveItemAtURL:location toURL:_localFileUrl error:&error];
  if (error) {
   self.reject(@"ERR_FILE_SYSTEM_UNABLE_TO_SAVE",
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
  if (error) {
    self.reject(@"ERR_FILE_SYSTEM_UNABLE_TO_DOWNLOAD",
                [NSString stringWithFormat:@"Unable to download file. %@", error.description],
                error);
    [self.sessionRegister unregister:session];
  }
}

@end
