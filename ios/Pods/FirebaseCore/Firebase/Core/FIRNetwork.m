// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/FIRNetwork.h"
#import "Private/FIRNetworkMessageCode.h"

#import "Private/FIRLogger.h"
#import "Private/FIRMutableDictionary.h"
#import "Private/FIRNetworkConstants.h"
#import "Private/FIRReachabilityChecker.h"

#import <GoogleToolboxForMac/GTMNSData+zlib.h>

/// Constant string for request header Content-Encoding.
static NSString *const kFIRNetworkContentCompressionKey = @"Content-Encoding";

/// Constant string for request header Content-Encoding value.
static NSString *const kFIRNetworkContentCompressionValue = @"gzip";

/// Constant string for request header Content-Length.
static NSString *const kFIRNetworkContentLengthKey = @"Content-Length";

/// Constant string for request header Content-Type.
static NSString *const kFIRNetworkContentTypeKey = @"Content-Type";

/// Constant string for request header Content-Type value.
static NSString *const kFIRNetworkContentTypeValue = @"application/x-www-form-urlencoded";

/// Constant string for GET request method.
static NSString *const kFIRNetworkGETRequestMethod = @"GET";

/// Constant string for POST request method.
static NSString *const kFIRNetworkPOSTRequestMethod = @"POST";

/// Default constant string as a prefix for network logger.
static NSString *const kFIRNetworkLogTag = @"Firebase/Network";

@interface FIRNetwork () <FIRReachabilityDelegate, FIRNetworkLoggerDelegate>
@end

@implementation FIRNetwork {
  /// Network reachability.
  FIRReachabilityChecker *_reachability;

  /// The dictionary of requests by session IDs { NSString : id }.
  FIRMutableDictionary *_requests;
}

- (instancetype)init {
  return [self initWithReachabilityHost:kFIRNetworkReachabilityHost];
}

- (instancetype)initWithReachabilityHost:(NSString *)reachabilityHost {
  self = [super init];
  if (self) {
    // Setup reachability.
    _reachability = [[FIRReachabilityChecker alloc] initWithReachabilityDelegate:self
                                                                  loggerDelegate:self
                                                                        withHost:reachabilityHost];
    if (![_reachability start]) {
      return nil;
    }

    _requests = [[FIRMutableDictionary alloc] init];
    _timeoutInterval = kFIRNetworkTimeOutInterval;
  }
  return self;
}

- (void)dealloc {
  _reachability.reachabilityDelegate = nil;
  [_reachability stop];
}

#pragma mark - External Methods

+ (void)handleEventsForBackgroundURLSessionID:(NSString *)sessionID
                            completionHandler:(FIRNetworkSystemCompletionHandler)completionHandler {
  [FIRNetworkURLSession handleEventsForBackgroundURLSessionID:sessionID
                                            completionHandler:completionHandler];
}

- (NSString *)postURL:(NSURL *)url
                   payload:(NSData *)payload
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(FIRNetworkCompletionHandler)handler {
  if (!url.absoluteString.length) {
    [self handleErrorWithCode:FIRErrorCodeNetworkInvalidURL queue:queue withHandler:handler];
    return nil;
  }

  NSTimeInterval timeOutInterval = _timeoutInterval ?: kFIRNetworkTimeOutInterval;

  NSMutableURLRequest *request =
      [[NSMutableURLRequest alloc] initWithURL:url
                                   cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                               timeoutInterval:timeOutInterval];

  if (!request) {
    [self handleErrorWithCode:FIRErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  NSError *compressError = nil;
  NSData *compressedData = [NSData gtm_dataByGzippingData:payload error:&compressError];
  if (!compressedData || compressError) {
    if (compressError || payload.length > 0) {
      // If the payload is not empty but it fails to compress the payload, something has been wrong.
      [self handleErrorWithCode:FIRErrorCodeNetworkPayloadCompression
                          queue:queue
                    withHandler:handler];
      return nil;
    }
    compressedData = [[NSData alloc] init];
  }

  NSString *postLength = @(compressedData.length).stringValue;

  // Set up the request with the compressed data.
  [request setValue:postLength forHTTPHeaderField:kFIRNetworkContentLengthKey];
  request.HTTPBody = compressedData;
  request.HTTPMethod = kFIRNetworkPOSTRequestMethod;
  [request setValue:kFIRNetworkContentTypeValue forHTTPHeaderField:kFIRNetworkContentTypeKey];
  [request setValue:kFIRNetworkContentCompressionValue
      forHTTPHeaderField:kFIRNetworkContentCompressionKey];

  FIRNetworkURLSession *fetcher = [[FIRNetworkURLSession alloc] initWithNetworkLoggerDelegate:self];
  fetcher.backgroundNetworkEnabled = usingBackgroundSession;

  __weak FIRNetwork *weakSelf = self;
  NSString *requestID = [fetcher
      sessionIDFromAsyncPOSTRequest:request
                  completionHandler:^(NSHTTPURLResponse *response, NSData *data,
                                      NSString *sessionID, NSError *error) {
                    FIRNetwork *strongSelf = weakSelf;
                    if (!strongSelf) {
                      return;
                    }
                    dispatch_queue_t queueToDispatch = queue ? queue : dispatch_get_main_queue();
                    dispatch_async(queueToDispatch, ^{
                      if (sessionID.length) {
                        [strongSelf->_requests removeObjectForKey:sessionID];
                      }
                      if (handler) {
                        handler(response, data, error);
                      }
                    });
                  }];
  if (!requestID) {
    [self handleErrorWithCode:FIRErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  [self firNetwork_logWithLevel:kFIRNetworkLogLevelDebug
                    messageCode:kFIRNetworkMessageCodeNetwork000
                        message:@"Uploading data. Host"
                        context:url];
  _requests[requestID] = fetcher;
  return requestID;
}

- (NSString *)getURL:(NSURL *)url
                   headers:(NSDictionary *)headers
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(FIRNetworkCompletionHandler)handler {
  if (!url.absoluteString.length) {
    [self handleErrorWithCode:FIRErrorCodeNetworkInvalidURL queue:queue withHandler:handler];
    return nil;
  }

  NSTimeInterval timeOutInterval = _timeoutInterval ?: kFIRNetworkTimeOutInterval;
  NSMutableURLRequest *request =
      [[NSMutableURLRequest alloc] initWithURL:url
                                   cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                               timeoutInterval:timeOutInterval];

  if (!request) {
    [self handleErrorWithCode:FIRErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  request.HTTPMethod = kFIRNetworkGETRequestMethod;
  request.allHTTPHeaderFields = headers;

  FIRNetworkURLSession *fetcher = [[FIRNetworkURLSession alloc] initWithNetworkLoggerDelegate:self];
  fetcher.backgroundNetworkEnabled = usingBackgroundSession;

  __weak FIRNetwork *weakSelf = self;
  NSString *requestID = [fetcher
      sessionIDFromAsyncGETRequest:request
                 completionHandler:^(NSHTTPURLResponse *response, NSData *data, NSString *sessionID,
                                     NSError *error) {
                   FIRNetwork *strongSelf = weakSelf;
                   if (!strongSelf) {
                     return;
                   }
                   dispatch_queue_t queueToDispatch = queue ? queue : dispatch_get_main_queue();
                   dispatch_async(queueToDispatch, ^{
                     if (sessionID.length) {
                       [strongSelf->_requests removeObjectForKey:sessionID];
                     }
                     if (handler) {
                       handler(response, data, error);
                     }
                   });
                 }];

  if (!requestID) {
    [self handleErrorWithCode:FIRErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  [self firNetwork_logWithLevel:kFIRNetworkLogLevelDebug
                    messageCode:kFIRNetworkMessageCodeNetwork001
                        message:@"Downloading data. Host"
                        context:url];
  _requests[requestID] = fetcher;
  return requestID;
}

- (BOOL)hasUploadInProgress {
  return _requests.count > 0;
}

#pragma mark - Network Reachability

/// Tells reachability delegate to call reachabilityDidChangeToStatus: to notify the network
/// reachability has changed.
- (void)reachability:(FIRReachabilityChecker *)reachability
       statusChanged:(FIRReachabilityStatus)status {
  _networkConnected = (status == kFIRReachabilityViaCellular || status == kFIRReachabilityViaWifi);
  [_reachabilityDelegate reachabilityDidChange];
}

#pragma mark - Network logger delegate

- (void)setLoggerDelegate:(id<FIRNetworkLoggerDelegate>)loggerDelegate {
  // Explicitly check whether the delegate responds to the methods because conformsToProtocol does
  // not work correctly even though the delegate does respond to the methods.
  if (!loggerDelegate ||
      ![loggerDelegate
          respondsToSelector:@selector(firNetwork_logWithLevel:messageCode:message:contexts:)] ||
      ![loggerDelegate
          respondsToSelector:@selector(firNetwork_logWithLevel:messageCode:message:context:)] ||
      !
      [loggerDelegate respondsToSelector:@selector(firNetwork_logWithLevel:messageCode:message:)]) {
    FIRLogError(kFIRLoggerAnalytics,
                [NSString stringWithFormat:@"I-NET%06ld", (long)kFIRNetworkMessageCodeNetwork002],
                @"Cannot set the network logger delegate: delegate does not conform to the network "
                 "logger protocol.");
    return;
  }
  _loggerDelegate = loggerDelegate;
}

#pragma mark - Private methods

/// Handles network error and calls completion handler with the error.
- (void)handleErrorWithCode:(NSInteger)code
                      queue:(dispatch_queue_t)queue
                withHandler:(FIRNetworkCompletionHandler)handler {
  NSDictionary *userInfo = @{kFIRNetworkErrorContext : @"Failed to create network request"};
  NSError *error =
      [[NSError alloc] initWithDomain:kFIRNetworkErrorDomain code:code userInfo:userInfo];
  [self firNetwork_logWithLevel:kFIRNetworkLogLevelWarning
                    messageCode:kFIRNetworkMessageCodeNetwork002
                        message:@"Failed to create network request. Code, error"
                       contexts:@[ @(code), error ]];
  if (handler) {
    dispatch_queue_t queueToDispatch = queue ? queue : dispatch_get_main_queue();
    dispatch_async(queueToDispatch, ^{
      handler(nil, nil, error);
    });
  }
}

#pragma mark - Network logger

- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message
                       contexts:(NSArray *)contexts {
  // Let the delegate log the message if there is a valid logger delegate. Otherwise, just log
  // errors/warnings/info messages to the console log.
  if (_loggerDelegate) {
    [_loggerDelegate firNetwork_logWithLevel:logLevel
                                 messageCode:messageCode
                                     message:message
                                    contexts:contexts];
    return;
  }
  if (_isDebugModeEnabled || logLevel == kFIRNetworkLogLevelError ||
      logLevel == kFIRNetworkLogLevelWarning || logLevel == kFIRNetworkLogLevelInfo) {
    NSString *formattedMessage = FIRStringWithLogMessage(message, logLevel, contexts);
    NSLog(@"%@", formattedMessage);
    FIRLogBasic((FIRLoggerLevel)logLevel, kFIRLoggerCore,
                [NSString stringWithFormat:@"I-NET%06ld", (long)messageCode], formattedMessage,
                NULL);
  }
}

- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message
                        context:(id)context {
  if (_loggerDelegate) {
    [_loggerDelegate firNetwork_logWithLevel:logLevel
                                 messageCode:messageCode
                                     message:message
                                     context:context];
    return;
  }
  NSArray *contexts = context ? @[ context ] : @[];
  [self firNetwork_logWithLevel:logLevel messageCode:messageCode message:message contexts:contexts];
}

- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message {
  if (_loggerDelegate) {
    [_loggerDelegate firNetwork_logWithLevel:logLevel messageCode:messageCode message:message];
    return;
  }
  [self firNetwork_logWithLevel:logLevel messageCode:messageCode message:message contexts:@[]];
}

/// Returns a string for the given log level (e.g. kFIRNetworkLogLevelError -> @"ERROR").
static NSString *FIRLogLevelDescriptionFromLogLevel(FIRNetworkLogLevel logLevel) {
  static NSDictionary *levelNames = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    levelNames = @{
      @(kFIRNetworkLogLevelError) : @"ERROR",
      @(kFIRNetworkLogLevelWarning) : @"WARNING",
      @(kFIRNetworkLogLevelInfo) : @"INFO",
      @(kFIRNetworkLogLevelDebug) : @"DEBUG"
    };
  });
  return levelNames[@(logLevel)];
}

/// Returns a formatted string to be used for console logging.
static NSString *FIRStringWithLogMessage(NSString *message,
                                         FIRNetworkLogLevel logLevel,
                                         NSArray *contexts) {
  if (!message) {
    message = @"(Message was nil)";
  } else if (!message.length) {
    message = @"(Message was empty)";
  }
  NSMutableString *result = [[NSMutableString alloc]
      initWithFormat:@"<%@/%@> %@", kFIRNetworkLogTag, FIRLogLevelDescriptionFromLogLevel(logLevel),
                     message];

  if (!contexts.count) {
    return result;
  }

  NSMutableArray *formattedContexts = [[NSMutableArray alloc] init];
  for (id item in contexts) {
    [formattedContexts addObject:(item != [NSNull null] ? item : @"(nil)")];
  }

  [result appendString:@": "];
  [result appendString:[formattedContexts componentsJoinedByString:@", "]];
  return result;
}

@end
