// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKGraphRequestConnection+Internal.h"

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKConstants.h"
#import "FBSDKCoreKit+Internal.h"
#import "FBSDKError.h"
#import "FBSDKErrorConfiguration.h"
#import "FBSDKGraphRequest+Internal.h"
#import "FBSDKGraphRequestBody.h"
#import "FBSDKGraphRequestDataAttachment.h"
#import "FBSDKGraphRequestMetadata.h"
#import "FBSDKGraphRequestPiggybackManager.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings+Internal.h"
#import "FBSDKURLSessionTask.h"

NSString *const FBSDKNonJSONResponseProperty = @"FACEBOOK_NON_JSON_RESULT";

// URL construction constants
static NSString *const kGraphURLPrefix = @"graph.";
static NSString *const kGraphVideoURLPrefix = @"graph-video.";

static NSString *const kBatchKey = @"batch";
static NSString *const kBatchMethodKey = @"method";
static NSString *const kBatchRelativeURLKey = @"relative_url";
static NSString *const kBatchAttachmentKey = @"attached_files";
static NSString *const kBatchFileNamePrefix = @"file";
static NSString *const kBatchEntryName = @"name";

static NSString *const kAccessTokenKey = @"access_token";
#if TARGET_OS_TV
static NSString *const kSDK = @"tvos";
static NSString *const kUserAgentBase = @"FBtvOSSDK";
#else
static NSString *const kSDK = @"ios";
static NSString *const kUserAgentBase = @"FBiOSSDK";
#endif
static NSString *const kBatchRestMethodBaseURL = @"method/";

static NSTimeInterval g_defaultTimeout = 60.0;

static FBSDKErrorConfiguration *g_errorConfiguration;

#if !TARGET_OS_TV
static FBSDKAccessToken *_CreateExpiredAccessToken(FBSDKAccessToken *accessToken)
{
  if (accessToken == nil) {
    return nil;
  }
  if (accessToken.isExpired) {
    return accessToken;
  }
  NSDate *expirationDate = [NSDate dateWithTimeIntervalSinceNow:-1];
  return [[FBSDKAccessToken alloc] initWithTokenString:accessToken.tokenString
                                           permissions:accessToken.permissions.allObjects
                                   declinedPermissions:accessToken.declinedPermissions.allObjects
                                                 appID:accessToken.appID
                                                userID:accessToken.userID
                                        expirationDate:expirationDate
                                           refreshDate:expirationDate
                                           dataAccessExpirationDate:expirationDate];
}
#endif

// ----------------------------------------------------------------------------
// FBSDKGraphRequestConnectionState

typedef NS_ENUM(NSUInteger, FBSDKGraphRequestConnectionState)
{
  kStateCreated,
  kStateSerialized,
  kStateStarted,
  kStateCompleted,
  kStateCancelled,
};

// ----------------------------------------------------------------------------
// Private properties and methods

@interface FBSDKGraphRequestConnection () <
NSURLSessionDataDelegate
#if !TARGET_OS_TV
, FBSDKGraphErrorRecoveryProcessorDelegate
#endif
>

@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) FBSDKURLSessionTask *task;
@property (nonatomic, retain) NSMutableArray *requests;
@property (nonatomic, assign) FBSDKGraphRequestConnectionState state;
@property (nonatomic, strong) FBSDKLogger *logger;
@property (nonatomic, assign) uint64_t requestStartTime;

@end

// ----------------------------------------------------------------------------
// FBSDKGraphRequestConnection

@implementation FBSDKGraphRequestConnection
{
  NSString *_overrideVersionPart;
  NSUInteger _expectingResults;
  NSOperationQueue *_delegateQueue;
#if !TARGET_OS_TV
  FBSDKGraphRequestMetadata *_recoveringRequestMetadata;
  FBSDKGraphErrorRecoveryProcessor *_errorRecoveryProcessor;
#endif
}

- (instancetype)init
{
  if ((self = [super init])) {
    _requests = [[NSMutableArray alloc] init];
    _timeout = g_defaultTimeout;
    _state = kStateCreated;
    _logger = [[FBSDKLogger alloc] initWithLoggingBehavior:FBSDKLoggingBehaviorNetworkRequests];
  }
  return self;
}

- (void)dealloc
{
  [_session invalidateAndCancel];
}

#pragma mark - Public

+ (void)setDefaultConnectionTimeout:(NSTimeInterval)defaultTimeout
{
  if (defaultTimeout >= 0) {
    g_defaultTimeout = defaultTimeout;
  }
}

- (void)addRequest:(FBSDKGraphRequest *)request
 completionHandler:(FBSDKGraphRequestHandler)handler
{
  [self addRequest:request completionHandler:handler batchEntryName:nil];
}

- (void)addRequest:(FBSDKGraphRequest *)request
 completionHandler:(FBSDKGraphRequestHandler)handler
    batchEntryName:(NSString *)name
{
  NSDictionary *batchParams = (name)? @{kBatchEntryName : name } : nil;
  [self addRequest:request completionHandler:handler batchParameters:batchParams];
}

- (void)addRequest:(FBSDKGraphRequest *)request
 completionHandler:(FBSDKGraphRequestHandler)handler
   batchParameters:(NSDictionary *)batchParameters
{
  if (self.state != kStateCreated) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Cannot add requests once started or if a URLRequest is set"
                                 userInfo:nil];
  }
  FBSDKGraphRequestMetadata *metadata = [[FBSDKGraphRequestMetadata alloc] initWithRequest:request
                                                                         completionHandler:handler
                                                                           batchParameters:batchParameters];

  [self.requests addObject:metadata];
}

- (void)cancel
{
  self.state = kStateCancelled;
  [self.task cancel];
  [self cleanUpSession];
}

- (void)overrideVersionPartWith:(NSString *)version
{
  if (![_overrideVersionPart isEqualToString:version]) {
    _overrideVersionPart = [version copy];
  }
}

- (void)start
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    g_errorConfiguration = [[FBSDKErrorConfiguration alloc] initWithDictionary:nil];
  });
  //optimistically check for updated server configuration;
  g_errorConfiguration = [FBSDKServerConfigurationManager cachedServerConfiguration].errorConfiguration ?: g_errorConfiguration;

  if (self.state != kStateCreated && self.state != kStateSerialized) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"FBSDKGraphRequestConnection cannot be started again."];
    return;
  }
  [FBSDKGraphRequestPiggybackManager addPiggybackRequests:self];
  NSMutableURLRequest *request = [self requestWithBatch:self.requests timeout:_timeout];

  self.state = kStateStarted;

  [self logRequest:request bodyLength:0 bodyLogger:nil attachmentLogger:nil];
  _requestStartTime = [FBSDKInternalUtility currentTimeInMilliseconds];

  FBSDKURLSessionTaskHandler handler =  ^(NSError *error,
                                          NSURLResponse *response,
                                          NSData *responseData) {
    [self completeFBSDKURLSessionWithResponse:response
                                         data:responseData
                                 networkError:error];
  };

  if (!self.session) {
    self.session = [self defaultSession];
  }

  self.task = [[FBSDKURLSessionTask alloc] initWithRequest:request
                                               fromSession:self.session
                                         completionHandler:handler];
  [self.task start];

  id<FBSDKGraphRequestConnectionDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(requestConnectionWillBeginLoading:)]) {
    if (_delegateQueue) {
      [_delegateQueue addOperationWithBlock:^{
        [delegate requestConnectionWillBeginLoading:self];
      }];
    } else {
      [delegate requestConnectionWillBeginLoading:self];
    }
  }
}

- (void)setDelegateQueue:(NSOperationQueue *)queue
{
  _delegateQueue = queue;
}

#pragma mark - Private methods (request generation)

//
// Adds request data to a batch in a format expected by the JsonWriter.
// Binary attachments are referenced by name in JSON and added to the
// attachments dictionary.
//
- (void)addRequest:(FBSDKGraphRequestMetadata *)metadata
           toBatch:(NSMutableArray *)batch
       attachments:(NSMutableDictionary *)attachments
        batchToken:(NSString *)batchToken
{
  NSMutableDictionary *requestElement = [[NSMutableDictionary alloc] init];

  if (metadata.batchParameters) {
    [requestElement addEntriesFromDictionary:metadata.batchParameters];
  }

  if (batchToken) {
    metadata.request.parameters[kAccessTokenKey] = batchToken;
    [self registerTokenToOmitFromLog:batchToken];
  }

  NSString *urlString = [self urlStringForSingleRequest:metadata.request forBatch:YES];
  requestElement[kBatchRelativeURLKey] = urlString;
  requestElement[kBatchMethodKey] = metadata.request.HTTPMethod;

  NSMutableArray *attachmentNames = [NSMutableArray array];

  [metadata.request.parameters enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
    if ([FBSDKGraphRequest isAttachment:value]) {
      NSString *name = [NSString stringWithFormat:@"%@%lu",
                        kBatchFileNamePrefix,
                        (unsigned long)[attachments count]];
      [attachmentNames addObject:name];
      attachments[name] = value;
    }
  }];

  if ([attachmentNames count]) {
    requestElement[kBatchAttachmentKey] = [attachmentNames componentsJoinedByString:@","];
  }

  [batch addObject:requestElement];
}

- (void)appendAttachments:(NSDictionary *)attachments
                   toBody:(FBSDKGraphRequestBody *)body
              addFormData:(BOOL)addFormData
                   logger:(FBSDKLogger *)logger
{
  [attachments enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
    value = [FBSDKInternalUtility convertRequestValue:value];
    if ([value isKindOfClass:[NSString class]]) {
      if (addFormData) {
        [body appendWithKey:key formValue:(NSString *)value logger:logger];
      }
    } else if ([value isKindOfClass:[UIImage class]]) {
      [body appendWithKey:key imageValue:(UIImage *)value logger:logger];
    } else if ([value isKindOfClass:[NSData class]]) {
      [body appendWithKey:key dataValue:(NSData *)value logger:logger];
    } else if ([value isKindOfClass:[FBSDKGraphRequestDataAttachment class]]) {
      [body appendWithKey:key dataAttachmentValue:(FBSDKGraphRequestDataAttachment *)value logger:logger];
    } else {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors formatString:@"Unsupported FBSDKGraphRequest attachment:%@, skipping.", value];
    }
  }];
}

//
// Serializes all requests in the batch to JSON and appends the result to
// body.  Also names all attachments that need to go as separate blocks in
// the body of the request.
//
// All the requests are serialized into JSON, with any binary attachments
// named and referenced by name in the JSON.
//
- (void)appendJSONRequests:(NSArray *)requests
                    toBody:(FBSDKGraphRequestBody *)body
        andNameAttachments:(NSMutableDictionary *)attachments
                    logger:(FBSDKLogger *)logger
{
  NSMutableArray *batch = [[NSMutableArray alloc] init];
  NSString *batchToken = nil;
  for (FBSDKGraphRequestMetadata *metadata in requests) {
    NSString *individualToken = [self accessTokenWithRequest:metadata.request];
    BOOL isClientToken = [FBSDKSettings clientToken] && [individualToken hasSuffix:[FBSDKSettings clientToken]];
    if (!batchToken &&
        !isClientToken) {
      batchToken = individualToken;
    }
    [self addRequest:metadata
             toBatch:batch
         attachments:attachments
          batchToken:[batchToken isEqualToString:individualToken] ? nil : individualToken];
  }

  NSString *jsonBatch = [FBSDKInternalUtility JSONStringForObject:batch error:NULL invalidObjectHandler:NULL];

  [body appendWithKey:kBatchKey formValue:jsonBatch logger:logger];
  if (batchToken) {
    [body appendWithKey:kAccessTokenKey formValue:batchToken logger:logger];
  }
}

- (BOOL)_shouldWarnOnMissingFieldsParam:(FBSDKGraphRequest *)request
{
  NSString *minVersion = @"2.4";
  NSString *version = request.version;
  if (!version) {
    return YES;
  }
  if ([version hasPrefix:@"v"]) {
    version = [version substringFromIndex:1];
  }

  NSComparisonResult result = [version compare:minVersion options:NSNumericSearch];

  // if current version is the same as minVersion, or if the current version is > minVersion
  return (result == NSOrderedSame) || (result == NSOrderedDescending);
}

// Validate that all GET requests after v2.4 have a "fields" param
- (void)_validateFieldsParamForGetRequests:(NSArray *)requests
{
  for (FBSDKGraphRequestMetadata *metadata in requests) {
    FBSDKGraphRequest *request = metadata.request;
    if ([request.HTTPMethod.uppercaseString isEqualToString:@"GET"] &&
        [self _shouldWarnOnMissingFieldsParam:request] &&
        !request.parameters[@"fields"] &&
        [request.graphPath rangeOfString:@"fields="].location == NSNotFound) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                         formatString:@"starting with Graph API v2.4, GET requests for /%@ should contain an explicit \"fields\" parameter", request.graphPath];
    }
  }
}

//
// Generates a NSURLRequest based on the contents of self.requests, and sets
// options on the request.  Chooses between URL-based request for a single
// request and JSON-based request for batches.
//
- (NSMutableURLRequest *)requestWithBatch:(NSArray *)requests
                                  timeout:(NSTimeInterval)timeout
{
  FBSDKGraphRequestBody *body = [[FBSDKGraphRequestBody alloc] init];
  FBSDKLogger *bodyLogger = [[FBSDKLogger alloc] initWithLoggingBehavior:_logger.loggingBehavior];
  FBSDKLogger *attachmentLogger = [[FBSDKLogger alloc] initWithLoggingBehavior:_logger.loggingBehavior];

  NSMutableURLRequest *request;

  if (requests.count == 0) {
    [[NSException exceptionWithName:NSInvalidArgumentException
                             reason:@"FBSDKGraphRequestConnection: Must have at least one request or urlRequest not specified."
                           userInfo:nil]
     raise];

  }

  [self _validateFieldsParamForGetRequests:requests];

  if ([requests count] == 1) {
    FBSDKGraphRequestMetadata *metadata = [requests objectAtIndex:0];
    NSURL *url = [NSURL URLWithString:[self urlStringForSingleRequest:metadata.request forBatch:NO]];
    request = [NSMutableURLRequest requestWithURL:url
                                      cachePolicy:NSURLRequestUseProtocolCachePolicy
                                  timeoutInterval:timeout];

    // HTTP methods are case-sensitive; be helpful in case someone provided a mixed case one.
    NSString *httpMethod = [metadata.request.HTTPMethod uppercaseString];
    [request setHTTPMethod:httpMethod];
    [self appendAttachments:metadata.request.parameters
                     toBody:body
                addFormData:[httpMethod isEqualToString:@"POST"]
                     logger:attachmentLogger];
  } else {
    // Find the session with an app ID and use that as the batch_app_id. If we can't
    // find one, try to load it from the plist. As a last resort, pass 0.
    NSString *batchAppID = [FBSDKSettings appID];
    if (!batchAppID || batchAppID.length == 0) {
      // The Graph API batch method requires either an access token or batch_app_id.
      // If we can't determine an App ID to use for the batch, we can't issue it.
      [[NSException exceptionWithName:NSInternalInconsistencyException
                               reason:@"FBSDKGraphRequestConnection: [FBSDKSettings appID] must be specified for batch requests"
                             userInfo:nil]
       raise];
    }

    [body appendWithKey:@"batch_app_id" formValue:batchAppID logger:bodyLogger];

    NSMutableDictionary *attachments = [[NSMutableDictionary alloc] init];

    [self appendJSONRequests:requests
                      toBody:body
          andNameAttachments:attachments
                      logger:bodyLogger];

    [self appendAttachments:attachments
                     toBody:body
                addFormData:NO
                     logger:attachmentLogger];

    NSURL *url = [FBSDKInternalUtility facebookURLWithHostPrefix:kGraphURLPrefix path:nil queryParameters:nil defaultVersion:_overrideVersionPart error:NULL];
    request = [NSMutableURLRequest requestWithURL:url
                                      cachePolicy:NSURLRequestUseProtocolCachePolicy
                                  timeoutInterval:timeout];
    [request setHTTPMethod:@"POST"];
  }

  [request setHTTPBody:[body data]];
  NSUInteger bodyLength = [[body data] length] / 1024;

  [request setValue:[FBSDKGraphRequestConnection userAgent] forHTTPHeaderField:@"User-Agent"];
  [request setValue:[body mimeContentType] forHTTPHeaderField:@"Content-Type"];
  [request setHTTPShouldHandleCookies:NO];

  [self logRequest:request bodyLength:bodyLength bodyLogger:bodyLogger attachmentLogger:attachmentLogger];

  return request;
}

//
// Generates a URL for a batch containing only a single request,
// and names all attachments that need to go in the body of the
// request.
//
// The URL contains all parameters that are not body attachments,
// including the session key if present.
//
// Attachments are named and referenced by name in the URL.
//
- (NSString *)urlStringForSingleRequest:(FBSDKGraphRequest *)request forBatch:(BOOL)forBatch
{
  request.parameters[@"format"] = @"json";
  request.parameters[@"sdk"] = kSDK;
  request.parameters[@"include_headers"] = @"false";

  NSString *baseURL;
  if (forBatch) {
    baseURL = request.graphPath;
  } else {
    NSString *token = [self accessTokenWithRequest:request];
    if (token) {
      [request.parameters setValue:token forKey:kAccessTokenKey];
      [self registerTokenToOmitFromLog:token];
    }

    NSString *prefix = kGraphURLPrefix;
    // We special case a graph post to <id>/videos and send it to graph-video.facebook.com
    // We only do this for non batch post requests
    NSString *graphPath = [request.graphPath lowercaseString];
    if ([[request.HTTPMethod uppercaseString] isEqualToString:@"POST"] &&
        [graphPath hasSuffix:@"/videos"]) {
      graphPath = [graphPath stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"/"]];
      NSArray *components = [graphPath componentsSeparatedByString:@"/"];
      if ([components count] == 2) {
        prefix = kGraphVideoURLPrefix;
      }
    }

    baseURL = [[FBSDKInternalUtility facebookURLWithHostPrefix:prefix path:request.graphPath queryParameters:nil defaultVersion:request.version error:NULL] absoluteString];
  }

  NSString *url = [FBSDKGraphRequest serializeURL:baseURL
                                           params:request.parameters
                                       httpMethod:request.HTTPMethod
                                         forBatch:forBatch];
  return url;
}

#pragma mark - Private methods (response parsing)

- (void)completeFBSDKURLSessionWithResponse:(NSURLResponse *)response
                                       data:(NSData *)data
                               networkError:(NSError *)error
{
  if (self.state != kStateCancelled) {
    NSAssert(self.state == kStateStarted,
             @"Unexpected state %lu in completeWithResponse",
             (unsigned long)self.state);
    self.state = kStateCompleted;
  }

  NSArray *results = nil;
  _URLResponse = (NSHTTPURLResponse *)response;
  if (response) {
    NSAssert([response isKindOfClass:[NSHTTPURLResponse class]],
             @"Expected NSHTTPURLResponse, got %@",
             response);

    NSInteger statusCode = _URLResponse.statusCode;

    if (!error && [response.MIMEType hasPrefix:@"image"]) {
      error = [FBSDKError errorWithCode:FBSDKGraphRequestNonTextMimeTypeReturnedErrorCode
                                message:@"Response is a non-text MIME type; endpoints that return images and other "
               @"binary data should be fetched using NSURLRequest and NSURLSession"];
    } else {
      results = [self parseJSONResponse:data
                                  error:&error
                             statusCode:statusCode];
    }
  } else if (!error) {
    error = [FBSDKError errorWithCode:FBSDKUnknownErrorCode
                              message:@"Missing NSURLResponse"];
  }

  if (!error) {
    if ([self.requests count] != [results count]) {
      error = [FBSDKError errorWithCode:FBSDKGraphRequestProtocolMismatchErrorCode
                                message:@"Unexpected number of results returned from server."];
    } else {
      [_logger appendFormat:@"Response <#%lu>\nDuration: %llu msec\nSize: %lu kB\nResponse Body:\n%@\n\n",
       (unsigned long)[_logger loggerSerialNumber],
       [FBSDKInternalUtility currentTimeInMilliseconds] - _requestStartTime,
       (unsigned long)[data length],
       results];
    }
  }

  if (error) {
    [_logger appendFormat:@"Response <#%lu> <Error>:\n%@\n%@\n",
     (unsigned long)[_logger loggerSerialNumber],
     [error localizedDescription],
     [error userInfo]];
  }
  [_logger emitToNSLog];

  [self completeWithResults:results networkError:error];

  [self cleanUpSession];
}

//
// If there is one request, the JSON is the response.
// If there are multiple requests, the JSON has an array of dictionaries whose
// body property is the response.
//   [{ "code":200,
//      "body":"JSON-response-as-a-string" },
//    { "code":200,
//      "body":"JSON-response-as-a-string" }]
//
// In both cases, this function returns an NSArray containing the results.
// The NSArray looks just like the multiple request case except the body
// value is converted from a string to parsed JSON.
//
- (NSArray *)parseJSONResponse:(NSData *)data
                         error:(NSError **)error
                    statusCode:(NSInteger)statusCode;
{
  // Graph API can return "true" or "false", which is not valid JSON.
  // Translate that before asking JSON parser to look at it.
  NSString *responseUTF8 = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  NSMutableArray *results = [[NSMutableArray alloc] init];;
  id response = [self parseJSONOrOtherwise:responseUTF8 error:error];

  if (responseUTF8 == nil) {
    NSString *base64Data = [data length] != 0 ? [data base64EncodedStringWithOptions:0] : @"";
    if (base64Data != nil) {
      [FBSDKAppEvents logImplicitEvent:@"fb_response_invalid_utf8"
                            valueToSum:nil
                            parameters:nil
                           accessToken:nil];
    }
  }

  NSDictionary *responseError = nil;
  if (!response) {
    if ((error != NULL) && (*error == nil)) {
      *error = [self errorWithCode:FBSDKUnknownErrorCode
                        statusCode:statusCode
                parsedJSONResponse:nil
                        innerError:nil
                           message:@"The server returned an unexpected response."];
    }
  } else if ([self.requests count] == 1) {
    // response is the entry, so put it in a dictionary under "body" and add
    // that to array of responses.
    [results addObject:@{
                         @"code":@(statusCode),
                         @"body":response
                         }];
  } else if ([response isKindOfClass:[NSArray class]]) {
    // response is the array of responses, but the body element of each needs
    // to be decoded from JSON.
    for (id item in response) {
      // Don't let errors parsing one response stop us from parsing another.
      NSError *batchResultError = nil;
      if (![item isKindOfClass:[NSDictionary class]]) {
        [results addObject:item];
      } else {
        NSMutableDictionary *result = [((NSDictionary *)item) mutableCopy];
        if (result[@"body"]) {
          result[@"body"] = [self parseJSONOrOtherwise:result[@"body"] error:&batchResultError];
        }
        [results addObject:result];
      }
      if (batchResultError) {
        // We'll report back the last error we saw.
        *error = batchResultError;
      }
    }
  } else if ([response isKindOfClass:[NSDictionary class]] &&
             (responseError = [FBSDKTypeUtility dictionaryValue:response[@"error"]]) != nil &&
             [responseError[@"type"] isEqualToString:@"OAuthException"]) {
    // if there was one request then return the only result. if there were multiple requests
    // but only one error then the server rejected the batch access token
    NSDictionary *result = @{
                             @"code":@(statusCode),
                             @"body":response
                             };

    for (NSUInteger resultIndex = 0, resultCount = self.requests.count; resultIndex < resultCount; ++resultIndex) {
      [results addObject:result];
    }
  } else if (error != NULL) {
    *error = [self errorWithCode:FBSDKGraphRequestProtocolMismatchErrorCode
                      statusCode:statusCode
              parsedJSONResponse:results
                      innerError:nil
                         message:nil];
  }

  return results;
}

- (id)parseJSONOrOtherwise:(NSString *)utf8
                     error:(NSError **)error
{
  id parsed = nil;
  if (!(*error) && [utf8 isKindOfClass:[NSString class]]) {
    parsed = [FBSDKInternalUtility objectForJSONString:utf8 error:error];
    // if we fail parse we attempt a re-parse of a modified input to support results in the form "foo=bar", "true", etc.
    // which is shouldn't be necessary since Graph API v2.1.
    if (*error) {
      // we round-trip our hand-wired response through the parser in order to remain
      // consistent with the rest of the output of this function (note, if perf turns out
      // to be a problem -- unlikely -- we can return the following dictionary outright)
      NSDictionary *original = @{ FBSDKNonJSONResponseProperty : utf8 };
      NSString *jsonrep = [FBSDKInternalUtility JSONStringForObject:original error:NULL invalidObjectHandler:NULL];
      NSError *reparseError = nil;
      parsed = [FBSDKInternalUtility objectForJSONString:jsonrep error:&reparseError];
      if (!reparseError) {
        *error = nil;
      }
    }
  }
  return parsed;
}

- (void)completeWithResults:(NSArray *)results
               networkError:(NSError *)networkError
{
  NSUInteger count = [self.requests count];
  _expectingResults = count;
  NSUInteger disabledRecoveryCount = 0;
  for (FBSDKGraphRequestMetadata *metadata in self.requests) {
    if ([metadata.request isGraphErrorRecoveryDisabled]) {
      disabledRecoveryCount++;
    }
  }
#if !TARGET_OS_TV
  BOOL isSingleRequestToRecover = (count - disabledRecoveryCount == 1);
#endif

  [self.requests enumerateObjectsUsingBlock:^(FBSDKGraphRequestMetadata *metadata, NSUInteger i, BOOL *stop) {
    id result = networkError ? nil : [results objectAtIndex:i];
    NSError *resultError = networkError ?: [self errorFromResult:result request:metadata.request];

    id body = nil;
    if (!resultError && [result isKindOfClass:[NSDictionary class]]) {
      NSDictionary *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
      body = [FBSDKTypeUtility dictionaryValue:resultDictionary[@"body"]];
    }

#if !TARGET_OS_TV
    if (resultError && ![metadata.request isGraphErrorRecoveryDisabled] && isSingleRequestToRecover) {
      self->_recoveringRequestMetadata = metadata;
      self->_errorRecoveryProcessor = [[FBSDKGraphErrorRecoveryProcessor alloc] init];
      if ([self->_errorRecoveryProcessor processError:resultError request:metadata.request delegate:self]) {
        return;
      }
    }
#endif

    [self processResultBody:body error:resultError metadata:metadata canNotifyDelegate:networkError == nil];
  }];

  if (networkError) {
    if ([_delegate respondsToSelector:@selector(requestConnection:didFailWithError:)]) {
      [_delegate requestConnection:self didFailWithError:networkError];
    }
  }
}

- (void)processResultBody:(NSDictionary *)body error:(NSError *)error metadata:(FBSDKGraphRequestMetadata *)metadata canNotifyDelegate:(BOOL)canNotifyDelegate
{
  void (^finishAndInvokeCompletionHandler)(void) = ^{
    NSDictionary *graphDebugDict = [body objectForKey:@"__debug__"];
    if ([graphDebugDict isKindOfClass:[NSDictionary class]]) {
      [self processResultDebugDictionary: graphDebugDict];
    }
    [metadata invokeCompletionHandlerForConnection:self withResults:body error:error];

    if (--self->_expectingResults == 0) {
      if (canNotifyDelegate && [self->_delegate respondsToSelector:@selector(requestConnectionDidFinishLoading:)]) {
        [self->_delegate requestConnectionDidFinishLoading:self];
      }
    }
  };

#if !TARGET_OS_TV
  void (^clearToken)(NSInteger) = ^(NSInteger errorSubcode){
    if (metadata.request.flags & FBSDKGraphRequestFlagDoNotInvalidateTokenOnError) {
      return;
    }
    if (errorSubcode == 493) {
      [FBSDKAccessToken setCurrentAccessToken:_CreateExpiredAccessToken([FBSDKAccessToken currentAccessToken])];
    } else {
      [FBSDKAccessToken setCurrentAccessToken:nil];
    }

  };

  FBSDKSystemAccountStoreAdapter *adapter = [FBSDKSystemAccountStoreAdapter sharedInstance];
  NSString *metadataTokenString = metadata.request.tokenString;
  NSString *currentTokenString = [FBSDKAccessToken currentAccessToken].tokenString;
  NSString *accountStoreTokenString = adapter.accessTokenString;
  BOOL isAccountStoreLogin = [metadataTokenString isEqualToString:accountStoreTokenString];

  if ([metadataTokenString isEqualToString:currentTokenString] || isAccountStoreLogin) {
    NSInteger errorCode = [error.userInfo[FBSDKGraphRequestErrorGraphErrorCode] integerValue];
    NSInteger errorSubcode = [error.userInfo[FBSDKGraphRequestErrorGraphErrorSubcode] integerValue];
    if (errorCode == 190 || errorCode == 102) {
      if (isAccountStoreLogin) {
        if (errorSubcode == 460) {
          // For iOS6, when the password is changed on the server, the system account store
          // will continue to issue the old token until the user has changed the
          // password AND _THEN_ a renew call is made. To prevent opening
          // with an old token which would immediately be closed, we tell our adapter
          // that we want to force a blocking renew until success.
          adapter.forceBlockingRenew = YES;
        } else {
          [adapter renewSystemAuthorization:^(ACAccountCredentialRenewResult result, NSError *renewError) {
            NSOperationQueue *queue = self->_delegateQueue ?: [NSOperationQueue mainQueue];
            [queue addOperationWithBlock:^{
              clearToken(errorSubcode);
              finishAndInvokeCompletionHandler();
            }];
          }];
          return;
        }
      }
      clearToken(errorSubcode);
    } else if (errorCode >= 200 && errorCode < 300) {
      // permission error
      [adapter renewSystemAuthorization:^(ACAccountCredentialRenewResult result, NSError *renewError) {
        NSOperationQueue *queue = self->_delegateQueue ?: [NSOperationQueue mainQueue];
        [queue addOperationWithBlock:finishAndInvokeCompletionHandler];
      }];
      return;
    }
  }
#endif
  // this is already on the queue since we are currently in the NSURLSession callback.
  finishAndInvokeCompletionHandler();
}

- (void)processResultDebugDictionary:(NSDictionary *)dict
{
  NSArray *messages = [FBSDKTypeUtility arrayValue:dict[@"messages"]];
  if (![messages count]) {
    return;
  }

  [messages enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    NSDictionary *messageDict = [FBSDKTypeUtility dictionaryValue:obj];
    NSString *message = [FBSDKTypeUtility stringValue:messageDict[@"message"]];
    NSString *type = [FBSDKTypeUtility stringValue:messageDict[@"type"]];
    NSString *link = [FBSDKTypeUtility stringValue:messageDict[@"link"]];
    if (!message || !type) {
      return;
    }

    NSString *loggingBehavior = FBSDKLoggingBehaviorGraphAPIDebugInfo;
    if ([type isEqualToString:@"warning"]) {
      loggingBehavior = FBSDKLoggingBehaviorGraphAPIDebugWarning;
    }
    if (link) {
      message = [message stringByAppendingFormat:@" Link: %@", link];
    }

    [FBSDKLogger singleShotLogEntry:loggingBehavior logEntry:message];
  }];

}

- (NSError *)errorFromResult:(id)result request:(FBSDKGraphRequest *)request
{
  if ([result isKindOfClass:[NSDictionary class]]) {
    NSDictionary *errorDictionary = [FBSDKTypeUtility dictionaryValue:result[@"body"]][@"error"];

    if ([errorDictionary isKindOfClass:[NSDictionary class]]) {
      NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"code"] forKey:FBSDKGraphRequestErrorGraphErrorCode];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_subcode"] forKey:FBSDKGraphRequestErrorGraphErrorSubcode];
      //"message" is preferred over error_msg or error_reason.
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_msg"] forKey:FBSDKErrorDeveloperMessageKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_reason"] forKey:FBSDKErrorDeveloperMessageKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"message"] forKey:FBSDKErrorDeveloperMessageKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_user_title"] forKey:FBSDKErrorLocalizedTitleKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_user_msg"] forKey:FBSDKErrorLocalizedDescriptionKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:errorDictionary[@"error_user_msg"] forKey:NSLocalizedDescriptionKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:result[@"code"] forKey:FBSDKGraphRequestErrorHTTPStatusCodeKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:result forKey:FBSDKGraphRequestErrorParsedJSONResponseKey];

      FBSDKErrorRecoveryConfiguration *recoveryConfiguration = [g_errorConfiguration
                                                                recoveryConfigurationForCode:[userInfo[FBSDKGraphRequestErrorGraphErrorCode] stringValue]
                                                                subcode:[userInfo[FBSDKGraphRequestErrorGraphErrorSubcode] stringValue]
                                                                request:request];
      if ([errorDictionary[@"is_transient"] boolValue]) {
        userInfo[FBSDKGraphRequestErrorCategoryKey] = @(FBSDKGraphRequestErrorCategoryTransient);
      } else {
        [FBSDKInternalUtility dictionary:userInfo setObject:@(recoveryConfiguration.errorCategory) forKey:FBSDKGraphRequestErrorCategoryKey];
      }
      [FBSDKInternalUtility dictionary:userInfo setObject:recoveryConfiguration.localizedRecoveryDescription forKey:NSLocalizedRecoverySuggestionErrorKey];
      [FBSDKInternalUtility dictionary:userInfo setObject:recoveryConfiguration.localizedRecoveryOptionDescriptions forKey:NSLocalizedRecoveryOptionsErrorKey];
      FBSDKErrorRecoveryAttempter *attempter = [FBSDKErrorRecoveryAttempter recoveryAttempterFromConfiguration:recoveryConfiguration];
      [FBSDKInternalUtility dictionary:userInfo setObject:attempter forKey:NSRecoveryAttempterErrorKey];

      return [FBSDKError errorWithCode:FBSDKGraphRequestGraphAPIErrorCode
                              userInfo:userInfo
                               message:nil
                       underlyingError:nil];
    }
  }

  return nil;
}

- (NSError *)errorWithCode:(FBSDKErrorCode)code
                statusCode:(NSInteger)statusCode
        parsedJSONResponse:(id)response
                innerError:(NSError *)innerError
                   message:(NSString *)message {
  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
  userInfo[FBSDKGraphRequestErrorHTTPStatusCodeKey] = @(statusCode);

  if (response) {
    userInfo[FBSDKGraphRequestErrorParsedJSONResponseKey] = response;
  }

  if (innerError) {
    userInfo[FBSDKGraphRequestErrorParsedJSONResponseKey] = innerError;
  }

  if (message) {
    userInfo[FBSDKErrorDeveloperMessageKey] = message;
  }

  NSError *error = [[NSError alloc]
                    initWithDomain:FBSDKErrorDomain
                    code:code
                    userInfo:userInfo];

  return error;
}

#pragma mark - Private methods (miscellaneous)

- (void)logRequest:(NSMutableURLRequest *)request
        bodyLength:(NSUInteger)bodyLength
        bodyLogger:(FBSDKLogger *)bodyLogger
  attachmentLogger:(FBSDKLogger *)attachmentLogger
{
  if (_logger.isActive) {
    [_logger appendFormat:@"Request <#%lu>:\n", (unsigned long)_logger.loggerSerialNumber];
    [_logger appendKey:@"URL" value:[[request URL] absoluteString]];
    [_logger appendKey:@"Method" value:[request HTTPMethod]];
    [_logger appendKey:@"UserAgent" value:[request valueForHTTPHeaderField:@"User-Agent"]];
    [_logger appendKey:@"MIME" value:[request valueForHTTPHeaderField:@"Content-Type"]];

    if (bodyLength != 0) {
      [_logger appendKey:@"Body Size" value:[NSString stringWithFormat:@"%lu kB", (unsigned long)bodyLength / 1024]];
    }

    if (bodyLogger != nil) {
      [_logger appendKey:@"Body (w/o attachments)" value:bodyLogger.contents];
    }

    if (attachmentLogger != nil) {
      [_logger appendKey:@"Attachments" value:attachmentLogger.contents];
    }

    [_logger appendString:@"\n"];

    [_logger emitToNSLog];
  }
}

- (NSString *)accessTokenWithRequest:(FBSDKGraphRequest *)request
{
  NSString *token = request.tokenString ?: request.parameters[kAccessTokenKey];
  if (!token && !(request.flags & FBSDKGraphRequestFlagSkipClientToken) && [FBSDKSettings clientToken].length > 0) {
    return [NSString stringWithFormat:@"%@|%@", [FBSDKSettings appID], [FBSDKSettings clientToken]];
  }
  return token;
}

- (void)registerTokenToOmitFromLog:(NSString *)token
{
  if (![[FBSDKSettings loggingBehavior] containsObject:FBSDKLoggingBehaviorAccessTokens]) {
    [FBSDKLogger registerStringToReplace:token replaceWith:@"ACCESS_TOKEN_REMOVED"];
  }
}

+ (NSString *)userAgent
{
  static NSString *agent = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    agent = [NSString stringWithFormat:@"%@.%@", kUserAgentBase, FBSDK_VERSION_STRING];
  });

  if ([FBSDKSettings userAgentSuffix]) {
    return [NSString stringWithFormat:@"%@/%@", agent, [FBSDKSettings userAgentSuffix]];
  }
  return agent;
}

- (NSURLSession *)defaultSession
{
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    return [NSURLSession sessionWithConfiguration:config
                                         delegate:self
                                    delegateQueue:_delegateQueue];
}

- (void)cleanUpSession
{
  [self.session invalidateAndCancel];
  self.session = nil;
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  id<FBSDKGraphRequestConnectionDelegate> delegate = self.delegate;

  if ([delegate respondsToSelector:@selector(requestConnection:didSendBodyData:totalBytesWritten:totalBytesExpectedToWrite:)]) {
    [delegate requestConnection:self
                didSendBodyData:(NSUInteger)bytesSent
              totalBytesWritten:(NSUInteger)totalBytesSent
      totalBytesExpectedToWrite:(NSUInteger)totalBytesExpectedToSend];
  }
}

#pragma mark - FBSDKGraphErrorRecoveryProcessorDelegate

#if !TARGET_OS_TV
- (void)processorDidAttemptRecovery:(FBSDKGraphErrorRecoveryProcessor *)processor didRecover:(BOOL)didRecover error:(NSError *)error
{
  if (didRecover) {
    FBSDKGraphRequest *originalRequest = _recoveringRequestMetadata.request;
    FBSDKGraphRequest *retryRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:originalRequest.graphPath
                                                                        parameters:originalRequest.parameters
                                                                       tokenString:[FBSDKAccessToken currentAccessToken].tokenString
                                                                           version:originalRequest.version
                                                                        HTTPMethod:originalRequest.HTTPMethod];
    // prevent further attempts at recovery (i.e., additional retries).
    [retryRequest setGraphErrorRecoveryDisabled:YES];
    FBSDKGraphRequestMetadata *retryMetadata = [[FBSDKGraphRequestMetadata alloc] initWithRequest:retryRequest completionHandler:_recoveringRequestMetadata.completionHandler batchParameters:_recoveringRequestMetadata.batchParameters];
    [retryRequest startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *retriedError) {
      [self processResultBody:result error:retriedError metadata:retryMetadata canNotifyDelegate:YES];
      self->_errorRecoveryProcessor = nil;
      self->_recoveringRequestMetadata = nil;
    }];
  } else {
    [self processResultBody:nil error:error metadata:_recoveringRequestMetadata canNotifyDelegate:YES];
    _errorRecoveryProcessor = nil;
    _recoveringRequestMetadata = nil;
  }
}
#endif

#pragma mark - Debugging helpers

- (NSString *)description
{
  NSMutableString *result = [NSMutableString stringWithFormat:@"<%@: %p, %lu request(s): (\n",
                             NSStringFromClass([self class]),
                             self,
                             (unsigned long)self.requests.count];
  BOOL comma = NO;
  for (FBSDKGraphRequestMetadata *metadata in self.requests) {
    FBSDKGraphRequest *request = metadata.request;
    if (comma) {
      [result appendString:@",\n"];
    }
    [result appendString:[request description]];
    comma = YES;
  }
  [result appendString:@"\n)>"];
  return result;

}

@end
