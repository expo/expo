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

#import "Private/GULNetwork.h"
#import "Private/GULNetworkMessageCode.h"

#import <GoogleUtilities/GULLogger.h>
#import <GoogleUtilities/GULNSData+zlib.h>
#import <GoogleUtilities/GULReachabilityChecker.h>
#import "Private/GULMutableDictionary.h"
#import "Private/GULNetworkConstants.h"

/// Constant string for request header Content-Encoding.
static NSString *const kGULNetworkContentCompressionKey = @"Content-Encoding";

/// Constant string for request header Content-Encoding value.
static NSString *const kGULNetworkContentCompressionValue = @"gzip";

/// Constant string for request header Content-Length.
static NSString *const kGULNetworkContentLengthKey = @"Content-Length";

/// Constant string for request header Content-Type.
static NSString *const kGULNetworkContentTypeKey = @"Content-Type";

/// Constant string for request header Content-Type value.
static NSString *const kGULNetworkContentTypeValue = @"application/x-www-form-urlencoded";

/// Constant string for GET request method.
static NSString *const kGULNetworkGETRequestMethod = @"GET";

/// Constant string for POST request method.
static NSString *const kGULNetworkPOSTRequestMethod = @"POST";

/// Default constant string as a prefix for network logger.
static NSString *const kGULNetworkLogTag = @"Google/Utilities/Network";

@interface GULNetwork () <GULReachabilityDelegate, GULNetworkLoggerDelegate>
@end

@implementation GULNetwork {
  /// Network reachability.
  GULReachabilityChecker *_reachability;

  /// The dictionary of requests by session IDs { NSString : id }.
  GULMutableDictionary *_requests;
}

- (instancetype)init {
  return [self initWithReachabilityHost:kGULNetworkReachabilityHost];
}

- (instancetype)initWithReachabilityHost:(NSString *)reachabilityHost {
  self = [super init];
  if (self) {
    // Setup reachability.
    _reachability = [[GULReachabilityChecker alloc] initWithReachabilityDelegate:self
                                                                        withHost:reachabilityHost];
    if (![_reachability start]) {
      return nil;
    }

    _requests = [[GULMutableDictionary alloc] init];
    _timeoutInterval = kGULNetworkTimeOutInterval;
  }
  return self;
}

- (void)dealloc {
  _reachability.reachabilityDelegate = nil;
  [_reachability stop];
}

#pragma mark - External Methods

+ (void)handleEventsForBackgroundURLSessionID:(NSString *)sessionID
                            completionHandler:(GULNetworkSystemCompletionHandler)completionHandler {
  [GULNetworkURLSession handleEventsForBackgroundURLSessionID:sessionID
                                            completionHandler:completionHandler];
}

- (NSString *)postURL:(NSURL *)url
                   payload:(NSData *)payload
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(GULNetworkCompletionHandler)handler {
  if (!url.absoluteString.length) {
    [self handleErrorWithCode:GULErrorCodeNetworkInvalidURL queue:queue withHandler:handler];
    return nil;
  }

  NSTimeInterval timeOutInterval = _timeoutInterval ?: kGULNetworkTimeOutInterval;

  NSMutableURLRequest *request =
      [[NSMutableURLRequest alloc] initWithURL:url
                                   cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                               timeoutInterval:timeOutInterval];

  if (!request) {
    [self handleErrorWithCode:GULErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  NSError *compressError = nil;
  NSData *compressedData = [NSData gul_dataByGzippingData:payload error:&compressError];
  if (!compressedData || compressError) {
    if (compressError || payload.length > 0) {
      // If the payload is not empty but it fails to compress the payload, something has been wrong.
      [self handleErrorWithCode:GULErrorCodeNetworkPayloadCompression
                          queue:queue
                    withHandler:handler];
      return nil;
    }
    compressedData = [[NSData alloc] init];
  }

  NSString *postLength = @(compressedData.length).stringValue;

  // Set up the request with the compressed data.
  [request setValue:postLength forHTTPHeaderField:kGULNetworkContentLengthKey];
  request.HTTPBody = compressedData;
  request.HTTPMethod = kGULNetworkPOSTRequestMethod;
  [request setValue:kGULNetworkContentTypeValue forHTTPHeaderField:kGULNetworkContentTypeKey];
  [request setValue:kGULNetworkContentCompressionValue
      forHTTPHeaderField:kGULNetworkContentCompressionKey];

  GULNetworkURLSession *fetcher = [[GULNetworkURLSession alloc] initWithNetworkLoggerDelegate:self];
  fetcher.backgroundNetworkEnabled = usingBackgroundSession;

  __weak GULNetwork *weakSelf = self;
  NSString *requestID = [fetcher
      sessionIDFromAsyncPOSTRequest:request
                  completionHandler:^(NSHTTPURLResponse *response, NSData *data,
                                      NSString *sessionID, NSError *error) {
                    GULNetwork *strongSelf = weakSelf;
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
    [self handleErrorWithCode:GULErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  [self GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                    messageCode:kGULNetworkMessageCodeNetwork000
                        message:@"Uploading data. Host"
                        context:url];
  _requests[requestID] = fetcher;
  return requestID;
}

- (NSString *)getURL:(NSURL *)url
                   headers:(NSDictionary *)headers
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(GULNetworkCompletionHandler)handler {
  if (!url.absoluteString.length) {
    [self handleErrorWithCode:GULErrorCodeNetworkInvalidURL queue:queue withHandler:handler];
    return nil;
  }

  NSTimeInterval timeOutInterval = _timeoutInterval ?: kGULNetworkTimeOutInterval;
  NSMutableURLRequest *request =
      [[NSMutableURLRequest alloc] initWithURL:url
                                   cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                               timeoutInterval:timeOutInterval];

  if (!request) {
    [self handleErrorWithCode:GULErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  request.HTTPMethod = kGULNetworkGETRequestMethod;
  request.allHTTPHeaderFields = headers;

  GULNetworkURLSession *fetcher = [[GULNetworkURLSession alloc] initWithNetworkLoggerDelegate:self];
  fetcher.backgroundNetworkEnabled = usingBackgroundSession;

  __weak GULNetwork *weakSelf = self;
  NSString *requestID = [fetcher
      sessionIDFromAsyncGETRequest:request
                 completionHandler:^(NSHTTPURLResponse *response, NSData *data, NSString *sessionID,
                                     NSError *error) {
                   GULNetwork *strongSelf = weakSelf;
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
    [self handleErrorWithCode:GULErrorCodeNetworkSessionTaskCreation
                        queue:queue
                  withHandler:handler];
    return nil;
  }

  [self GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                    messageCode:kGULNetworkMessageCodeNetwork001
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
- (void)reachability:(GULReachabilityChecker *)reachability
       statusChanged:(GULReachabilityStatus)status {
  _networkConnected = (status == kGULReachabilityViaCellular || status == kGULReachabilityViaWifi);
  [_reachabilityDelegate reachabilityDidChange];
}

#pragma mark - Network logger delegate

- (void)setLoggerDelegate:(id<GULNetworkLoggerDelegate>)loggerDelegate {
  // Explicitly check whether the delegate responds to the methods because conformsToProtocol does
  // not work correctly even though the delegate does respond to the methods.
  if (!loggerDelegate ||
      ![loggerDelegate respondsToSelector:@selector(GULNetwork_logWithLevel:
                                                                messageCode:message:contexts:)] ||
      ![loggerDelegate respondsToSelector:@selector(GULNetwork_logWithLevel:
                                                                messageCode:message:context:)] ||
      ![loggerDelegate respondsToSelector:@selector(GULNetwork_logWithLevel:
                                                                messageCode:message:)]) {
    GULLogError(kGULLoggerNetwork, NO,
                [NSString stringWithFormat:@"I-NET%06ld", (long)kGULNetworkMessageCodeNetwork002],
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
                withHandler:(GULNetworkCompletionHandler)handler {
  NSDictionary *userInfo = @{kGULNetworkErrorContext : @"Failed to create network request"};
  NSError *error = [[NSError alloc] initWithDomain:kGULNetworkErrorDomain
                                              code:code
                                          userInfo:userInfo];
  [self GULNetwork_logWithLevel:kGULNetworkLogLevelWarning
                    messageCode:kGULNetworkMessageCodeNetwork002
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

- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message
                       contexts:(NSArray *)contexts {
  // Let the delegate log the message if there is a valid logger delegate. Otherwise, just log
  // errors/warnings/info messages to the console log.
  if (_loggerDelegate) {
    [_loggerDelegate GULNetwork_logWithLevel:logLevel
                                 messageCode:messageCode
                                     message:message
                                    contexts:contexts];
    return;
  }
  if (_isDebugModeEnabled || logLevel == kGULNetworkLogLevelError ||
      logLevel == kGULNetworkLogLevelWarning || logLevel == kGULNetworkLogLevelInfo) {
    NSString *formattedMessage = GULStringWithLogMessage(message, logLevel, contexts);
    NSLog(@"%@", formattedMessage);
    GULLogBasic((GULLoggerLevel)logLevel, kGULLoggerNetwork, NO,
                [NSString stringWithFormat:@"I-NET%06ld", (long)messageCode], formattedMessage,
                NULL);
  }
}

- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message
                        context:(id)context {
  if (_loggerDelegate) {
    [_loggerDelegate GULNetwork_logWithLevel:logLevel
                                 messageCode:messageCode
                                     message:message
                                     context:context];
    return;
  }
  NSArray *contexts = context ? @[ context ] : @[];
  [self GULNetwork_logWithLevel:logLevel messageCode:messageCode message:message contexts:contexts];
}

- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message {
  if (_loggerDelegate) {
    [_loggerDelegate GULNetwork_logWithLevel:logLevel messageCode:messageCode message:message];
    return;
  }
  [self GULNetwork_logWithLevel:logLevel messageCode:messageCode message:message contexts:@[]];
}

/// Returns a string for the given log level (e.g. kGULNetworkLogLevelError -> @"ERROR").
static NSString *GULLogLevelDescriptionFromLogLevel(GULNetworkLogLevel logLevel) {
  static NSDictionary *levelNames = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    levelNames = @{
      @(kGULNetworkLogLevelError) : @"ERROR",
      @(kGULNetworkLogLevelWarning) : @"WARNING",
      @(kGULNetworkLogLevelInfo) : @"INFO",
      @(kGULNetworkLogLevelDebug) : @"DEBUG"
    };
  });
  return levelNames[@(logLevel)];
}

/// Returns a formatted string to be used for console logging.
static NSString *GULStringWithLogMessage(NSString *message,
                                         GULNetworkLogLevel logLevel,
                                         NSArray *contexts) {
  if (!message) {
    message = @"(Message was nil)";
  } else if (!message.length) {
    message = @"(Message was empty)";
  }
  NSMutableString *result = [[NSMutableString alloc]
      initWithFormat:@"<%@/%@> %@", kGULNetworkLogTag, GULLogLevelDescriptionFromLogLevel(logLevel),
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
