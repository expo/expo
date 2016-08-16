// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXJavaScriptResource.h"

@implementation EXJavaScriptResource

- (instancetype)initWithBundleName:(NSString *)bundleName remoteUrl:(NSURL *)url
{
  if (self = [super initWithResourceName:bundleName resourceType:@"bundle" remoteUrl:url cachePath:[[self class] javaScriptCachePath]]) {
    self.urlCache = [[self class] javaScriptCache];
  }
  return self;
}

+ (NSString *)javaScriptCachePath
{
  NSString *cachesDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
  NSString *sourceDirectory = [cachesDirectory stringByAppendingPathComponent:@"Sources"];
  
  BOOL cacheDirectoryExists = [[NSFileManager defaultManager] fileExistsAtPath:sourceDirectory isDirectory:nil];
  if (!cacheDirectoryExists) {
    NSError *error;
    BOOL created = [[NSFileManager defaultManager] createDirectoryAtPath:sourceDirectory
                                             withIntermediateDirectories:YES
                                                              attributes:nil
                                                                   error:&error];
    if (created) {
      cacheDirectoryExists = YES;
    } else {
      DDLogError(@"Could not create source cache directory: %@", error.localizedDescription);
    }
  }
  
  return (cacheDirectoryExists) ? sourceDirectory : nil;
}

+ (NSURLCache *)javaScriptCache
{
  static NSURLCache *cache;
  
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *sourceDirectory = [self javaScriptCachePath];
    if (sourceDirectory) {
      cache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024 diskCapacity:20 * 1024 * 1024 diskPath:sourceDirectory];
    }
  });
  
  return cache;
}

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response
{
  if (![response.MIMEType isEqualToString:@"application/javascript"]) {
    NSString *errDescription = [self _getContentErrorDescriptionForResponse:response data:data];
    return [NSError errorWithDomain:NSURLErrorDomain
                               code:NSURLErrorCannotParseResponse
                           userInfo:@{
                                      NSLocalizedDescriptionKey: errDescription,
                                      @"response": response,
                                      @"data": data
                                      }];
  }
  return nil;
}

- (NSString *)_getContentErrorDescriptionForResponse:(NSURLResponse *)response data:(NSData *)data
{
  NSString *result;
  NSString *responseContentType = response.MIMEType;
  if ([responseContentType isEqualToString:@"application/json"]) {
    NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    result = [NSString stringWithFormat:@"Expected JavaScript, but got JSON: %@", dataString];
  } else {
    NSString *recoverySuggestion = @"Check that your internet connection is working.";
    if ([responseContentType rangeOfString:@"text"].length > 0) {
      NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
      if ([dataString rangeOfString:@"tunnel"].length > 0) {
        recoverySuggestion = @"Check that your internet connection is working and try restarting your tunnel.";
      }
    }
    result = [NSString stringWithFormat:@"Expected JavaScript, but got content type '%@'. %@", responseContentType, recoverySuggestion];
  }
  return result;
}

@end
