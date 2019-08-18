// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client.h"
#import "EXBuildConstants.h"
#import "EXKernelUtil.h"

NS_ASSUME_NONNULL_BEGIN

NSString * const EXApiErrorDomain = @"www";

NSString * const EXApiResponseKey = @"EXApiResponse";
NSString * const EXApiResultKey = @"EXApiResult";
NSString * const EXApiHttpStatusCodeKey = @"EXApiHttpStatusCode";
NSString * const EXApiErrorCodeKey = @"EXApiErrorCode";
NSString * const EXApiErrorStackKey = @"EXApiHttpStatusCode";

NSString * const EXApiHttpCacheDirectory = @"kernel-www";


@interface EXApiV2Client ()

@property (nonatomic, strong, readonly) NSURLSession *urlSession;

@end


@implementation EXApiV2Client

+ (instancetype)sharedClient
{
  static EXApiV2Client *client;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSURLSessionConfiguration *sessionConfiguration = [self _secureUrlSessionConfiguration];
    NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration];
    client = [[EXApiV2Client alloc] initWithUrlSession:session];
  });
  return client;
}

+ (NSURLSessionConfiguration *)_secureUrlSessionConfiguration
{
  NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
  configuration.HTTPAdditionalHeaders= @{
                                         @"expo-platform": @"ios",
                                         };
  
  // Enforce TLS 1.2+ in production
  configuration.TLSMinimumSupportedProtocol = kTLSProtocol12;
  
  // Isolate the kernel's HTTP cache to mitigate side-channel attacks
  NSURLCache *defaultUrlCache = NSURLCache.sharedURLCache;
  configuration.URLCache = [[NSURLCache alloc] initWithMemoryCapacity:defaultUrlCache.memoryCapacity
                                                         diskCapacity:defaultUrlCache.diskCapacity
                                                             diskPath:EXApiHttpCacheDirectory];
  
  return configuration;
}

+ (BOOL)_canSendBodyWithHttpMethod:(NSString *)httpMethod
{
  static NSSet<NSString *> *httpMethodsWithBody;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    httpMethodsWithBody = [NSSet setWithObjects:@"POST", @"PUT", @"PATCH", nil];
  });
  return [httpMethodsWithBody containsObject:httpMethod.uppercaseString];
}

- (instancetype)initWithUrlSession:(NSURLSession *)urlSession
{
  if (self = [super init]) {
    _urlSession = urlSession;
  }
  return self;
}

- (nullable NSURLSessionTask *)callRemoteMethod:(NSString *)methodPath
                                      arguments:(nullable NSDictionary *)arguments
                                     httpMethod:(NSString *)httpMethod
                              completionHandler:(EXApiV2CompletionHandler)handler
{
  NSURL *apiEndpoint = [EXBuildConstants sharedInstance].apiServerEndpoint;
  NSURL *remoteMethodUrl = [NSURL URLWithString:methodPath relativeToURL:apiEndpoint].absoluteURL;
  if (arguments && ![EXApiV2Client _canSendBodyWithHttpMethod:httpMethod]) {
    remoteMethodUrl = [self _urlFromRemoteMethodUrl:remoteMethodUrl withArguments:arguments];
  }
  
  NSMutableDictionary *headers = [NSMutableDictionary dictionaryWithDictionary:@{
                                                                                 @"accept": @"application/json",
                                                                                 }];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:remoteMethodUrl];
  request.timeoutInterval = 30;
  request.HTTPMethod = httpMethod;
  request.HTTPShouldHandleCookies = NO;
  
  if (arguments && [EXApiV2Client _canSendBodyWithHttpMethod:httpMethod]) {
    NSError *error = nil;
    NSData *requestBody = [self _requestBodyForMethod:methodPath arguments:arguments error:&error];
    if (!requestBody) {
      handler(nil, error);
      return nil;
    }
    request.HTTPBody = requestBody;
    headers[@"content-type"] = @"application/json; charset=utf-8";
  }
  
  request.allHTTPHeaderFields = headers;
  NSURLSessionTask *task = [_urlSession dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data,
                                                                                        NSURLResponse * _Nullable response,
                                                                                        NSError * _Nullable error) {
    // Network errors
    if (error) {
      handler(nil, error);
      return;
    }
    
    NSAssert([response isKindOfClass:[NSHTTPURLResponse class]], @"The API response must be an HTTP response");
    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
    
    // Malformed response errors
    if (!data) {
      NSError *responseError = [NSError errorWithDomain:EXApiErrorDomain
                                                   code:EXApiErrorCodeEmptyResponse
                                               userInfo:@{
                                                          NSLocalizedDescriptionKey: @"The Expo server's response was empty",
                                                          EXApiHttpStatusCodeKey: @(httpResponse.statusCode),
                                                          }];
      handler(nil, responseError);
      return;
    }
    
    NSError *jsonError = nil;
    id object = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];
    if (!object) {
      NSError *responseError = [NSError errorWithDomain:EXApiErrorDomain
                                                   code:EXApiErrorCodeMalformedJson
                                               userInfo:@{
                                                          NSLocalizedDescriptionKey: @"The Expo server's response wasn't valid JSON",
                                                          NSUnderlyingErrorKey: jsonError,
                                                          EXApiHttpStatusCodeKey: @(httpResponse.statusCode),
                                                          }];
      handler(nil, responseError);
      return;
    }
    
    if (![object isKindOfClass:[NSDictionary class]]) {
      NSError *responseError = [NSError errorWithDomain:EXApiErrorDomain
                                                   code:EXApiErrorCodeMalformedResponse
                                               userInfo:@{
                                                          NSLocalizedDescriptionKey: @"The Expo server's response wasn't a JSON object",
                                                          EXApiResponseKey: object,
                                                          EXApiHttpStatusCodeKey: @(httpResponse.statusCode),
                                                          }];
      handler(nil, responseError);
      return;
    }
    
    // API response (which could have API-level errors)
    id<NSObject> resultData = nil;
    NSError *resultError = nil;
    NSDictionary *resultObject = object;
    
    if (resultObject[@"data"]) {
      resultData = resultObject[@"data"];
    }
    
    if ([resultObject[@"errors"] isKindOfClass:[NSArray class]]) {
      NSArray *errorObjects = resultObject[@"errors"];
      if ([errorObjects.firstObject isKindOfClass:[NSDictionary class]]) {
        resultError = [self _errorFromDictionary:errorObjects.firstObject];
      }
    }
    
    EXApiV2Result *result = [[EXApiV2Result alloc] initWithData:resultData
                                                          error:resultError
                                                 httpStatusCode:httpResponse.statusCode];
    handler(result, result.error);
  }];
  
  // The kernel receives higher priority than individual apps
  task.priority = NSURLSessionTaskPriorityHigh;
  [task resume];
  return task;
}

- (NSURL *)_urlFromRemoteMethodUrl:(NSURL *)url withArguments:(NSDictionary *)arguments
{
  NSURLComponents *urlComponents = [NSURLComponents componentsWithURL:url
                                              resolvingAgainstBaseURL:YES];
  NSMutableArray<NSURLQueryItem *> *queryItems =
  [urlComponents.queryItems mutableCopy] ?: [NSMutableArray arrayWithCapacity:arguments.count];
  for (NSString *parameterName in arguments) {
    NSString *parameterValue = [arguments[parameterName] description];
    [queryItems addObject:[NSURLQueryItem queryItemWithName:parameterName value:parameterValue]];
  }
  urlComponents.queryItems = queryItems;
  return urlComponents.URL;
}

- (NSData *)_requestBodyForMethod:(NSString *)methodPath arguments:(NSDictionary *)arguments error:(NSError **)error
{
  if (![NSJSONSerialization isValidJSONObject:arguments]) {
    *error = [NSError errorWithDomain:EXApiErrorDomain
                                 code:EXApiErrorCodeMalformedRequestBody
                             userInfo:@{
                                        NSLocalizedDescriptionKey: [NSString stringWithFormat:@"The arguments for the remote API call to \"%@\" cannot be encoded as JSON", methodPath],
                                        
                                        }];
    return nil;
  }
  
  NSError *jsonError = nil;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:arguments options:0 error:&jsonError];
  if (!jsonData) {
    *error = [NSError errorWithDomain:EXApiErrorDomain
                                 code:EXApiErrorCodeMalformedRequestBody
                             userInfo:@{
                                        NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Something went wrong encoding the arguments for the remote API call to \"%@\"", methodPath],
                                        NSUnderlyingErrorKey: jsonError,
                                        }];
    return nil;
  }
  
  return jsonData;
}

- (NSError *)_errorFromDictionary:(NSDictionary *)errorObject
{
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];
  
  errorInfo[NSLocalizedDescriptionKey] = errorObject[@"message"]
    ? [errorObject[@"message"] description]
    : @"Something went wrong communicating with the Expo server.";
  
  errorInfo[EXApiErrorCodeKey] = errorObject[@"code"]
    ? [errorObject[@"code"] description]
    : @"UNKNOWN";
  
  if ([errorObject[@"details"] isKindOfClass:[NSString class]]) {
    errorInfo[NSLocalizedFailureReasonErrorKey] = errorObject[@"details"];
  }
  
  if ([errorObject[@"stack"] isKindOfClass:[NSString class]]) {
    errorInfo[EXApiErrorStackKey] = errorObject[@"stack"];
  }
  
  return [NSError errorWithDomain:EXApiErrorDomain code:EXApiErrorCodeApiError userInfo:errorInfo];
}

@end

NS_ASSUME_NONNULL_END
