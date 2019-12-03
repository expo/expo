// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiUtil.h"
#import "EXEnvironment.h"
#import "EXJavaScriptResource.h"
#import "EXKernelUtil.h"

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
  return [[self class] cachePathWithName:@"Sources"];
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
  // For dev builds that use the packager use RCTJavaScriptLoader which handles the packager's multipart
  // responses to show loading progress.
  if (self.devToolsEnabled) {
    __block EXLoadingProgress *progress = [EXLoadingProgress new];
    [RCTJavaScriptLoader loadBundleAtURL:self.remoteUrl onProgress:^(RCTLoadingProgress *progressData) {
      progress.total = progressData.total;
      progress.done = progressData.done;
      progress.status = progressData.status ?: @"Building JavaScript bundle...";
      if (progressBlock) {
        progressBlock(progress);
      }
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

- (BOOL)isUsingEmbeddedResource
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    // if the URL of our request matches the remote URL of the embedded JS bundle,
    // skip checking any caches and just immediately open the NSBundle copy
    if ([EXEnvironment sharedEnvironment].embeddedBundleUrl &&
        [self.remoteUrl isEqual:[EXApiUtil encodedUrlFromString:[EXEnvironment sharedEnvironment].embeddedBundleUrl]]) {
      return YES;
    } else {
      return NO;
    }
  } else {
    // we only need this because the bundle URL of prod home never changes, so we need
    // to use the legacy logic and load embedded home if and only if a cached copy doesn't exist.
    // TODO: get rid of this branch once prod home is loaded like any other bundle!!!!!!!
    return [super isUsingEmbeddedResource];
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
