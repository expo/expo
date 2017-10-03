// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXJavaScriptResource.h"
#import "EXKernelUtil.h"
#import "EXShellManager.h"

#import <React/RCTJavaScriptLoader.h>

@interface EXJavaScriptResource ()

@property (nonatomic, assign) BOOL devToolsEnabled;

@end

@implementation EXJavaScriptResource

- (instancetype)initWithBundleName:(NSString *)bundleName remoteUrl:(NSURL *)url devToolsEnabled:(BOOL)devToolsEnabled
{
  if (self = [super initWithResourceName:bundleName resourceType:@"bundle" remoteUrl:url cachePath:[[self class] javaScriptCachePath]]) {
    self.urlCache = [[self class] javaScriptCache];
    self.devToolsEnabled = devToolsEnabled;
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

- (void)loadResourceWithBehavior:(EXCachedResourceBehavior)behavior
                   progressBlock:(__nullable EXCachedResourceProgressBlock)progressBlock
                    successBlock:(EXCachedResourceSuccessBlock)successBlock
                      errorBlock:(EXCachedResourceErrorBlock)errorBlock
{
  if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].isRemoteJSEnabled) {
    // JS downloads are disabled
    if (behavior != kEXCachedResourceOnlyCache) {
      behavior = kEXCachedResourceOnlyCache;
      DDLogWarn(@"%s: JS downloads are not allowed. Local resource will be used if it exists.", __func__);
    }
  }
  
  // For dev builds that use the packager use RCTJavaScriptLoader which handles the packager's multipart
  // responses to show loading progress.
  if (self.devToolsEnabled) {
    [RCTJavaScriptLoader loadBundleAtURL:self.remoteUrl onProgress:^(RCTLoadingProgress *progressData) {
      EXLoadingProgress *progress = [EXLoadingProgress new];
      progress.total = progressData.total;
      progress.done = progressData.done;
      progress.status = progressData.status ?: @"Building JavaScript bundle...";
      progressBlock(progress);
    } onComplete:^(NSError *error, RCTSource *source) {
      if (error != nil) {
        // In case we received something else than JS add more info to the error specific to expo for
        // things like tunnel errors.
        if ([error.domain isEqualToString:@"JSServer"] && error.code == NSURLErrorCannotParseResponse) {
          NSString *errDescription = [self _getContentErrorDescriptionForResponse:error.userInfo[@"headers"] data:error.userInfo[@"data"]];
          error = [NSError errorWithDomain:NSURLErrorDomain
                                      code:NSURLErrorCannotParseResponse
                                  userInfo:@{
                                             NSLocalizedDescriptionKey: errDescription,
                                             @"headers": error.userInfo[@"headers"],
                                             @"data": error.userInfo[@"data"]
                                             }];
        }
        errorBlock(error);
      } else {
        successBlock(source.data);
      }
    }];
  } else {
    [super loadResourceWithBehavior:behavior
                      progressBlock:progressBlock
                       successBlock:successBlock
                         errorBlock:errorBlock];
  }
}

- (NSError *)_validateResponseData:(NSData *)data response:(NSURLResponse *)response
{
  if (![response.MIMEType isEqualToString:@"application/javascript"]) {
    NSString *errDescription = [self _getContentErrorDescriptionForResponse:((NSHTTPURLResponse *)response).allHeaderFields data:data];
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

- (NSString *)_getContentErrorDescriptionForResponse:(NSDictionary *)headers data:(NSData *)data
{
  NSString *result;
  NSString *responseContentType = headers[@"Content-Type"];
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
