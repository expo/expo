// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXSessionDownloadTaskDelegate.h>
#import <CommonCrypto/CommonDigest.h>

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
    result[@"md5"] = EXNullIfNil([EXSessionDownloadTaskDelegate md5StringFromData:data]);
  }
  return result;
}

+ (nullable NSString *)md5StringFromData:(nullable NSData *)data
{
  if (!data) {
    return nil;
  }
  unsigned char digest[CC_MD5_DIGEST_LENGTH];
  CC_MD5(data.bytes, (CC_LONG)data.length, digest);
  NSMutableString *md5 = [NSMutableString stringWithCapacity:2 * CC_MD5_DIGEST_LENGTH];
  for (unsigned int i = 0; i < CC_MD5_DIGEST_LENGTH; ++i) {
    [md5 appendFormat:@"%02x", digest[i]];
  }
  return md5;
}

@end
