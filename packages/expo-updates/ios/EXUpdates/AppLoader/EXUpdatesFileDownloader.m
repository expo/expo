//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncherNoDatabase.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesCrypto.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const kEXUpdatesFileDownloaderErrorDomain = @"EXUpdatesFileDownloader";
NSTimeInterval const kEXUpdatesDefaultTimeoutInterval = 60;

@interface EXUpdatesFileDownloader () <NSURLSessionDataDelegate>

@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) NSURLSessionConfiguration *sessionConfiguration;

@end

@implementation EXUpdatesFileDownloader

- (instancetype)init
{
  if (self = [super init]) {
    _sessionConfiguration = NSURLSessionConfiguration.defaultSessionConfiguration;
    _session = [NSURLSession sessionWithConfiguration:_sessionConfiguration delegate:self delegateQueue:nil];
  }
  return self;
}

- (instancetype)initWithURLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration
{
  if (self = [super init]) {
    _sessionConfiguration = sessionConfiguration ?: NSURLSessionConfiguration.defaultSessionConfiguration;
    _session = [NSURLSession sessionWithConfiguration:_sessionConfiguration delegate:self delegateQueue:nil];
  }
  return self;
}

- (void)dealloc
{
  [_session finishTasksAndInvalidate];
}

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  [self downloadDataFromURL:url successBlock:^(NSData *data, NSURLResponse *response) {
    NSError *error;
    if ([data writeToFile:destinationPath options:NSDataWritingAtomic error:&error]) {
      successBlock(data, response);
    } else {
      errorBlock([NSError errorWithDomain:kEXUpdatesFileDownloaderErrorDomain
                                     code:1002
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Could not write to path %@: %@", destinationPath, error.localizedDescription],
                                   NSUnderlyingErrorKey: error
                                 }
                  ], response);
    }
  } errorBlock:errorBlock];
}

- (void)downloadManifestFromURL:(NSURL *)url
                   successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url
                                                         cachePolicy:NSURLRequestReloadIgnoringCacheData
                                                     timeoutInterval:kEXUpdatesDefaultTimeoutInterval];
  [self _setManifestHTTPHeaderFields:request];
  [self _downloadDataWithRequest:request successBlock:^(NSData *data, NSURLResponse *response) {
    NSError *err;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&err];
    NSAssert(!err && manifest && [manifest isKindOfClass:[NSDictionary class]], @"manifest should be a valid JSON object");

    id innerManifestString = manifest[@"manifestString"];
    id signature = manifest[@"signature"];
    if (innerManifestString && signature) {
      NSAssert([innerManifestString isKindOfClass:[NSString class]], @"manifestString should be a string");
      NSAssert([signature isKindOfClass:[NSString class]], @"signature should be a string");
      [EXUpdatesCrypto verifySignatureWithData:(NSString *)innerManifestString
                                     signature:(NSString *)signature
                                  successBlock:^(BOOL isValid) {
                                                  if (isValid) {
                                                    NSError *err;
                                                    id innerManifest = [NSJSONSerialization JSONObjectWithData:[(NSString *)innerManifestString dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&err];
                                                    NSAssert(!err && innerManifest && [innerManifest isKindOfClass:[NSDictionary class]], @"manifest should be a valid JSON object");
                                                    EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithManifest:(NSDictionary *)innerManifest];
                                                    successBlock(update);
                                                  } else {
                                                    NSError *error = [NSError errorWithDomain:kEXUpdatesFileDownloaderErrorDomain code:1003 userInfo:@{NSLocalizedDescriptionKey: @"Manifest verification failed"}];
                                                    errorBlock(error, response);
                                                  }
                                                }
                                    errorBlock:^(NSError *error) {
                                                  errorBlock(error, response);
                                                }
      ];
    } else {
      EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithManifest:(NSDictionary *)manifest];
      successBlock(update);
    }
  } errorBlock:errorBlock];
}

- (void)downloadDataFromURL:(NSURL *)url
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  // pass any custom cache policy onto this specific request
  NSURLRequestCachePolicy cachePolicy = _sessionConfiguration ? _sessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:kEXUpdatesDefaultTimeoutInterval];
  [self _setHTTPHeaderFields:request];

  [self _downloadDataWithRequest:request successBlock:successBlock errorBlock:errorBlock];
}

- (void)_downloadDataWithRequest:(NSURLRequest *)request
                    successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                      errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (!error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode != 200) {
        NSStringEncoding encoding = [self _encodingFromResponse:response];
        NSString *body = [[NSString alloc] initWithData:data encoding:encoding];
        error = [self _errorFromResponse:httpResponse body:body];
      }
    }

    if (error) {
      errorBlock(error, response);
    } else {
      successBlock(data, response);
    }
  }];
  [task resume];
}

- (void)_setHTTPHeaderFields:(NSMutableURLRequest *)request
{
  [request setValue:@"ios" forHTTPHeaderField:@"Expo-Platform"];
  [request setValue:@"1" forHTTPHeaderField:@"Expo-Api-Version"];
  [request setValue:@"BARE" forHTTPHeaderField:@"Expo-Updates-Environment"];
}

- (void)_setManifestHTTPHeaderFields:(NSMutableURLRequest *)request
{
  [self _setHTTPHeaderFields:request];
  [request setValue:@"application/expo+json,application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:@"true" forHTTPHeaderField:@"Expo-JSON-Error"];
  [request setValue:@"true" forHTTPHeaderField:@"Expo-Accept-Signature"];
  [request setValue:[EXUpdatesConfig sharedInstance].releaseChannel forHTTPHeaderField:@"Expo-Release-Channel"];

  NSString *runtimeVersion = [EXUpdatesConfig sharedInstance].runtimeVersion;
  if (runtimeVersion) {
    [request setValue:runtimeVersion forHTTPHeaderField:@"Expo-Runtime-Version"];
  } else {
    [request setValue:[EXUpdatesConfig sharedInstance].sdkVersion forHTTPHeaderField:@"Expo-SDK-Version"];
  }

  NSString *previousFatalError = [EXUpdatesAppLauncherNoDatabase consumeError];
  if (previousFatalError) {
    // some servers can have max length restrictions for headers,
    // so we restrict the length of the string to 1024 characters --
    // this should satisfy the requirements of most servers
    if ([previousFatalError length] > 1024) {
      previousFatalError = [previousFatalError substringToIndex:1024];
    }
    [request setValue:previousFatalError forHTTPHeaderField:@"Expo-Fatal-Error"];
  }
}

#pragma mark - NSURLSessionTaskDelegate

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler
{
  completionHandler(request);
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask willCacheResponse:(NSCachedURLResponse *)proposedResponse completionHandler:(void (^)(NSCachedURLResponse *cachedResponse))completionHandler
{
  completionHandler(proposedResponse);
}

#pragma mark - Parsing the response

- (NSStringEncoding)_encodingFromResponse:(NSURLResponse *)response
{
  if (response.textEncodingName) {
    CFStringRef cfEncodingName = (__bridge CFStringRef)response.textEncodingName;
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding(cfEncodingName);
    if (cfEncoding != kCFStringEncodingInvalidId) {
      return CFStringConvertEncodingToNSStringEncoding(cfEncoding);
    }
  }
  // Default to UTF-8
  return NSUTF8StringEncoding;
}

- (NSError *)_errorFromResponse:(NSHTTPURLResponse *)response body:(NSString *)body
{
  NSDictionary *userInfo = @{
                             NSLocalizedDescriptionKey: body,
                             };
  return [NSError errorWithDomain:kEXUpdatesFileDownloaderErrorDomain code:response.statusCode userInfo:userInfo];
}

@end

NS_ASSUME_NONNULL_END
