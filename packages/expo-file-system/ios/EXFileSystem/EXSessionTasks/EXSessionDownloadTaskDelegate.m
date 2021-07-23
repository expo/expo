// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>
#import <EXFileSystem/NSData+EXFileSystem.h>

@interface EXSessionDownloadTaskDelegate ()

@property (strong, nonatomic) NSURL *localUrl;
@property (nonatomic) BOOL shouldCalculateMd5;

@end

@implementation EXSessionDownloadTaskDelegate

- (instancetype)initWithResolve:(EXPromiseResolveBlock)resolve
                         reject:(EXPromiseRejectBlock)reject
                       localUrl:(NSURL *)localUrl
             shouldCalculateMd5:(BOOL)shouldCalculateMd5
{
  if (self = [super initWithResolve:resolve reject:reject])
  {
    _localUrl = localUrl;
    _shouldCalculateMd5 = shouldCalculateMd5;
  }
  return self;
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  NSError *error;
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:_localUrl.path]) {
    [fileManager removeItemAtURL:_localUrl error:&error];
    if (error) {
      self.reject(@"ERR_FILESYSTEM_CANNOT_REMOVE",
                  [NSString stringWithFormat:@"Unable to remove file from local URI: '%@'", error.description],
                  error);
      return;
    }
  }

  [fileManager moveItemAtURL:location toURL:_localUrl error:&error];
  if (error) {
    self.reject(@"ERR_FILESYSTEM_CANNOT_SAVE",
                [NSString stringWithFormat:@"Unable to save file to local URI: '%@'", error.description],
                error);
    return;
  }

  self.resolve([self parseServerResponse:downloadTask.response]);
}

- (NSDictionary *)parseServerResponse:(NSURLResponse *)response
{
  NSMutableDictionary *result = [[super parseServerResponse:response] mutableCopy];
  result[@"uri"] = _localUrl.absoluteString;
  if (_shouldCalculateMd5) {
    NSData *data = [NSData dataWithContentsOfURL:_localUrl];
    result[@"md5"] = [data md5String];
  }
  return result;
}

@end
