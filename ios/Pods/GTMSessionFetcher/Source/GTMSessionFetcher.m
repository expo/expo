/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GTMSessionFetcher.h"

#import <sys/utsname.h>

#ifndef STRIP_GTM_FETCH_LOGGING
  #error GTMSessionFetcher headers should have defaulted this if it wasn't already defined.
#endif

GTM_ASSUME_NONNULL_BEGIN

NSString *const kGTMSessionFetcherStartedNotification           = @"kGTMSessionFetcherStartedNotification";
NSString *const kGTMSessionFetcherStoppedNotification           = @"kGTMSessionFetcherStoppedNotification";
NSString *const kGTMSessionFetcherRetryDelayStartedNotification = @"kGTMSessionFetcherRetryDelayStartedNotification";
NSString *const kGTMSessionFetcherRetryDelayStoppedNotification = @"kGTMSessionFetcherRetryDelayStoppedNotification";

NSString *const kGTMSessionFetcherCompletionInvokedNotification = @"kGTMSessionFetcherCompletionInvokedNotification";
NSString *const kGTMSessionFetcherCompletionDataKey = @"data";
NSString *const kGTMSessionFetcherCompletionErrorKey = @"error";

NSString *const kGTMSessionFetcherErrorDomain       = @"com.google.GTMSessionFetcher";
NSString *const kGTMSessionFetcherStatusDomain      = @"com.google.HTTPStatus";
NSString *const kGTMSessionFetcherStatusDataKey     = @"data";  // data returned with a kGTMSessionFetcherStatusDomain error
NSString *const kGTMSessionFetcherStatusDataContentTypeKey = @"data_content_type";

NSString *const kGTMSessionFetcherNumberOfRetriesDoneKey        = @"kGTMSessionFetcherNumberOfRetriesDoneKey";
NSString *const kGTMSessionFetcherElapsedIntervalWithRetriesKey = @"kGTMSessionFetcherElapsedIntervalWithRetriesKey";

static NSString *const kGTMSessionIdentifierPrefix = @"com.google.GTMSessionFetcher";
static NSString *const kGTMSessionIdentifierDestinationFileURLMetadataKey = @"_destURL";
static NSString *const kGTMSessionIdentifierBodyFileURLMetadataKey        = @"_bodyURL";

// The default max retry interview is 10 minutes for uploads (POST/PUT/PATCH),
// 1 minute for downloads.
static const NSTimeInterval kUnsetMaxRetryInterval = -1.0;
static const NSTimeInterval kDefaultMaxDownloadRetryInterval = 60.0;
static const NSTimeInterval kDefaultMaxUploadRetryInterval = 60.0 * 10.;

// The maximum data length that can be loaded to the error userInfo
static const int64_t kMaximumDownloadErrorDataLength = 20000;

#ifdef GTMSESSION_PERSISTED_DESTINATION_KEY
// Projects using unique class names should also define a unique persisted destination key.
static NSString * const kGTMSessionFetcherPersistedDestinationKey =
    GTMSESSION_PERSISTED_DESTINATION_KEY;
#else
static NSString * const kGTMSessionFetcherPersistedDestinationKey =
    @"com.google.GTMSessionFetcher.downloads";
#endif

GTM_ASSUME_NONNULL_END

//
// GTMSessionFetcher
//

#if 0
#define GTM_LOG_BACKGROUND_SESSION(...) GTMSESSION_LOG_DEBUG(__VA_ARGS__)
#else
#define GTM_LOG_BACKGROUND_SESSION(...)
#endif

#ifndef GTM_TARGET_SUPPORTS_APP_TRANSPORT_SECURITY
  #if (TARGET_OS_TV \
       || TARGET_OS_WATCH \
       || (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_11) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_11) \
       || (TARGET_OS_IPHONE && defined(__IPHONE_9_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0))
    #define GTM_TARGET_SUPPORTS_APP_TRANSPORT_SECURITY 1
  #endif
#endif

@interface GTMSessionFetcher ()

@property(atomic, strong, readwrite, GTM_NULLABLE) NSData *downloadedData;
@property(atomic, strong, readwrite, GTM_NULLABLE) NSData *downloadResumeData;

#if GTM_BACKGROUND_TASK_FETCHING
// Should always be accessed within an @synchronized(self).
@property(assign, nonatomic) UIBackgroundTaskIdentifier backgroundTaskIdentifier;
#endif

@property(atomic, readwrite, getter=isUsingBackgroundSession) BOOL usingBackgroundSession;

@end

#if !GTMSESSION_BUILD_COMBINED_SOURCES
@interface GTMSessionFetcher (GTMSessionFetcherLoggingInternal)
- (void)logFetchWithError:(NSError *)error;
- (void)logNowWithError:(GTM_NULLABLE NSError *)error;
- (NSInputStream *)loggedInputStreamForInputStream:(NSInputStream *)inputStream;
- (GTMSessionFetcherBodyStreamProvider)loggedStreamProviderForStreamProvider:
    (GTMSessionFetcherBodyStreamProvider)streamProvider;
@end
#endif  // !GTMSESSION_BUILD_COMBINED_SOURCES

GTM_ASSUME_NONNULL_BEGIN

static NSTimeInterval InitialMinRetryInterval(void) {
  return 1.0 + ((double)(arc4random_uniform(0x0FFFF)) / (double) 0x0FFFF);
}

static BOOL IsLocalhost(NSString * GTM_NULLABLE_TYPE host) {
  // We check if there's host, and then make the comparisons.
  if (host == nil) return NO;
  return ([host caseInsensitiveCompare:@"localhost"] == NSOrderedSame
          || [host isEqual:@"::1"]
          || [host isEqual:@"127.0.0.1"]);
}

static NSDictionary *GTM_NULLABLE_TYPE GTMErrorUserInfoForData(
    NSData *GTM_NULLABLE_TYPE data, NSDictionary *GTM_NULLABLE_TYPE responseHeaders) {
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];

  if (data.length > 0) {
    userInfo[kGTMSessionFetcherStatusDataKey] = data;

    NSString *contentType = responseHeaders[@"Content-Type"];
    if (contentType) {
      userInfo[kGTMSessionFetcherStatusDataContentTypeKey] = contentType;
    }
  }

  return userInfo.count > 0 ? userInfo : nil;
}

static GTMSessionFetcherTestBlock GTM_NULLABLE_TYPE gGlobalTestBlock;

@implementation GTMSessionFetcher {
  NSMutableURLRequest *_request; // after beginFetch, changed only in delegate callbacks
  BOOL _useUploadTask;           // immutable after beginFetch
  NSURL *_bodyFileURL;           // immutable after beginFetch
  GTMSessionFetcherBodyStreamProvider _bodyStreamProvider;  // immutable after beginFetch
  NSURLSession *_session;
  BOOL _shouldInvalidateSession;  // immutable after beginFetch
  NSURLSession *_sessionNeedingInvalidation;
  NSURLSessionConfiguration *_configuration;
  NSURLSessionTask *_sessionTask;
  NSString *_taskDescription;
  float _taskPriority;
  NSURLResponse *_response;
  NSString *_sessionIdentifier;
  BOOL _wasCreatedFromBackgroundSession;
  BOOL _didCreateSessionIdentifier;
  NSString *_sessionIdentifierUUID;
  BOOL _userRequestedBackgroundSession;
  BOOL _usingBackgroundSession;
  NSMutableData * GTM_NULLABLE_TYPE _downloadedData;
  NSError *_downloadFinishedError;
  NSData *_downloadResumeData;  // immutable after construction
  NSData * GTM_NULLABLE_TYPE _downloadTaskErrorData; // Data for when download task fails
  NSURL *_destinationFileURL;
  int64_t _downloadedLength;
  NSURLCredential *_credential;     // username & password
  NSURLCredential *_proxyCredential; // credential supplied to proxy servers
  BOOL _isStopNotificationNeeded;   // set when start notification has been sent
  BOOL _isUsingTestBlock;  // set when a test block was provided (remains set when the block is released)
  id _userData;                      // retained, if set by caller
  NSMutableDictionary *_properties;  // more data retained for caller
  dispatch_queue_t _callbackQueue;
  dispatch_group_t _callbackGroup;   // read-only after creation
  NSOperationQueue *_delegateQueue;  // immutable after beginFetch

  id<GTMFetcherAuthorizationProtocol> _authorizer;  // immutable after beginFetch

  // The service object that created and monitors this fetcher, if any.
  id<GTMSessionFetcherServiceProtocol> _service;  // immutable; set by the fetcher service upon creation
  NSString *_serviceHost;
  NSInteger _servicePriority;       // immutable after beginFetch
  BOOL _hasStoppedFetching;         // counterpart to _initialBeginFetchDate
  BOOL _userStoppedFetching;

  BOOL _isRetryEnabled;             // user wants auto-retry
  NSTimer *_retryTimer;
  NSUInteger _retryCount;
  NSTimeInterval _maxRetryInterval; // default 60 (download) or 600 (upload) seconds
  NSTimeInterval _minRetryInterval; // random between 1 and 2 seconds
  NSTimeInterval _retryFactor;      // default interval multiplier is 2
  NSTimeInterval _lastRetryInterval;
  NSDate *_initialBeginFetchDate;   // date that beginFetch was first invoked; immutable after initial beginFetch
  NSDate *_initialRequestDate;      // date of first request to the target server (ignoring auth)
  BOOL _hasAttemptedAuthRefresh;    // accessed only in shouldRetryNowForStatus:

  NSString *_comment;               // comment for log
  NSString *_log;
#if !STRIP_GTM_FETCH_LOGGING
  NSMutableData *_loggedStreamData;
  NSURL *_redirectedFromURL;
  NSString *_logRequestBody;
  NSString *_logResponseBody;
  BOOL _hasLoggedError;
  BOOL _deferResponseBodyLogging;
#endif
}

#if !GTMSESSION_UNIT_TESTING
+ (void)load {
  [self fetchersForBackgroundSessions];
}
#endif

+ (instancetype)fetcherWithRequest:(GTM_NULLABLE NSURLRequest *)request {
  return [[self alloc] initWithRequest:request configuration:nil];
}

+ (instancetype)fetcherWithURL:(NSURL *)requestURL {
  return [self fetcherWithRequest:[NSURLRequest requestWithURL:requestURL]];
}

+ (instancetype)fetcherWithURLString:(NSString *)requestURLString {
  return [self fetcherWithURL:(NSURL *)[NSURL URLWithString:requestURLString]];
}

+ (instancetype)fetcherWithDownloadResumeData:(NSData *)resumeData {
  GTMSessionFetcher *fetcher = [self fetcherWithRequest:nil];
  fetcher.comment = @"Resuming download";
  fetcher.downloadResumeData = resumeData;
  return fetcher;
}

+ (GTM_NULLABLE instancetype)fetcherWithSessionIdentifier:(NSString *)sessionIdentifier {
  GTMSESSION_ASSERT_DEBUG(sessionIdentifier != nil, @"Invalid session identifier");
  NSMapTable *sessionIdentifierToFetcherMap = [self sessionIdentifierToFetcherMap];
  GTMSessionFetcher *fetcher = [sessionIdentifierToFetcherMap objectForKey:sessionIdentifier];
  if (!fetcher && [sessionIdentifier hasPrefix:kGTMSessionIdentifierPrefix]) {
    fetcher = [self fetcherWithRequest:nil];
    [fetcher setSessionIdentifier:sessionIdentifier];
    [sessionIdentifierToFetcherMap setObject:fetcher forKey:sessionIdentifier];
    fetcher->_wasCreatedFromBackgroundSession = YES;
    [fetcher setCommentWithFormat:@"Resuming %@",
     fetcher && fetcher->_sessionIdentifierUUID ? fetcher->_sessionIdentifierUUID : @"?"];
  }
  return fetcher;
}

+ (NSMapTable *)sessionIdentifierToFetcherMap {
  // TODO: What if a service is involved in creating the fetcher? Currently, when re-creating
  // fetchers, if a service was involved, it is not re-created. Should the service maintain a map?
  static NSMapTable *gSessionIdentifierToFetcherMap = nil;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gSessionIdentifierToFetcherMap = [NSMapTable strongToWeakObjectsMapTable];
  });
  return gSessionIdentifierToFetcherMap;
}

#if !GTM_ALLOW_INSECURE_REQUESTS
+ (BOOL)appAllowsInsecureRequests {
  // If the main bundle Info.plist key NSAppTransportSecurity is present, and it specifies
  // NSAllowsArbitraryLoads, then we need to explicitly enforce secure schemes.
#if GTM_TARGET_SUPPORTS_APP_TRANSPORT_SECURITY
  static BOOL allowsInsecureRequests;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSBundle *mainBundle = [NSBundle mainBundle];
    NSDictionary *appTransportSecurity =
        [mainBundle objectForInfoDictionaryKey:@"NSAppTransportSecurity"];
    allowsInsecureRequests =
        [[appTransportSecurity objectForKey:@"NSAllowsArbitraryLoads"] boolValue];
  });
  return allowsInsecureRequests;
#else
  // For builds targeting iOS 8 or 10.10 and earlier, we want to require fetcher
  // security checks.
  return YES;
#endif  // GTM_TARGET_SUPPORTS_APP_TRANSPORT_SECURITY
}
#else  // GTM_ALLOW_INSECURE_REQUESTS
+ (BOOL)appAllowsInsecureRequests {
  return YES;
}
#endif  // !GTM_ALLOW_INSECURE_REQUESTS


- (instancetype)init {
  return [self initWithRequest:nil configuration:nil];
}

- (instancetype)initWithRequest:(NSURLRequest *)request  {
  return [self initWithRequest:request configuration:nil];
}

- (instancetype)initWithRequest:(GTM_NULLABLE NSURLRequest *)request
                  configuration:(GTM_NULLABLE NSURLSessionConfiguration *)configuration {
  self = [super init];
  if (self) {
#if GTM_BACKGROUND_TASK_FETCHING
    _backgroundTaskIdentifier = UIBackgroundTaskInvalid;
#endif
    _request = [request mutableCopy];
    _configuration = configuration;

    NSData *bodyData = request.HTTPBody;
    if (bodyData) {
      _bodyLength = (int64_t)bodyData.length;
    } else {
      _bodyLength = NSURLSessionTransferSizeUnknown;
    }

    _callbackQueue = dispatch_get_main_queue();
    _callbackGroup = dispatch_group_create();
    _delegateQueue = [NSOperationQueue mainQueue];

    _minRetryInterval = InitialMinRetryInterval();
    _maxRetryInterval = kUnsetMaxRetryInterval;

    _taskPriority = -1.0f;  // Valid values if set are 0.0...1.0.

    _testBlockAccumulateDataChunkCount = 1;

#if !STRIP_GTM_FETCH_LOGGING
    // Encourage developers to set the comment property or use
    // setCommentWithFormat: by providing a default string.
    _comment = @"(No fetcher comment set)";
#endif
  }
  return self;
}

- (id)copyWithZone:(NSZone *)zone {
  // disallow use of fetchers in a copy property
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

- (NSString *)description {
  NSString *requestStr = self.request.URL.description;
  if (requestStr.length == 0) {
    if (self.downloadResumeData.length > 0) {
      requestStr = @"<download resume data>";
    } else if (_wasCreatedFromBackgroundSession) {
      requestStr = @"<from bg session>";
    } else {
      requestStr = @"<no request>";
    }
  }
  return [NSString stringWithFormat:@"%@ %p (%@)", [self class], self, requestStr];
}

- (void)dealloc {
  GTMSESSION_ASSERT_DEBUG(!_isStopNotificationNeeded,
                          @"unbalanced fetcher notification for %@", _request.URL);
  [self forgetSessionIdentifierForFetcherWithoutSyncCheck];

  // Note: if a session task or a retry timer was pending, then this instance
  // would be retained by those so it wouldn't be getting dealloc'd,
  // hence we don't need to stopFetch here
}

#pragma mark -

// Begin fetching the URL (or begin a retry fetch).  The delegate is retained
// for the duration of the fetch connection.

- (void)beginFetchWithCompletionHandler:(GTM_NULLABLE GTMSessionFetcherCompletionHandler)handler {
  GTMSessionCheckNotSynchronized(self);

  _completionHandler = [handler copy];

  // The user may have called setDelegate: earlier if they want to use other
  // delegate-style callbacks during the fetch; otherwise, the delegate is nil,
  // which is fine.
  [self beginFetchMayDelay:YES mayAuthorize:YES];
}

// Begin fetching the URL for a retry fetch. The delegate and completion handler
// are already provided, and do not need to be copied.
- (void)beginFetchForRetry {
  GTMSessionCheckNotSynchronized(self);

  [self beginFetchMayDelay:YES mayAuthorize:YES];
}

- (GTMSessionFetcherCompletionHandler)completionHandlerWithTarget:(GTM_NULLABLE_TYPE id)target
                                                didFinishSelector:(GTM_NULLABLE_TYPE SEL)finishedSelector {
  GTMSessionFetcherAssertValidSelector(target, finishedSelector, @encode(GTMSessionFetcher *),
                                       @encode(NSData *), @encode(NSError *), 0);
  GTMSessionFetcherCompletionHandler completionHandler = ^(NSData *data, NSError *error) {
      if (target && finishedSelector) {
        id selfArg = self;  // Placate ARC.
        NSMethodSignature *sig = [target methodSignatureForSelector:finishedSelector];
        NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
        [invocation setSelector:(SEL)finishedSelector];
        [invocation setTarget:target];
        [invocation setArgument:&selfArg atIndex:2];
        [invocation setArgument:&data atIndex:3];
        [invocation setArgument:&error atIndex:4];
        [invocation invoke];
      }
  };
  return completionHandler;
}

- (void)beginFetchWithDelegate:(GTM_NULLABLE_TYPE id)target
             didFinishSelector:(GTM_NULLABLE_TYPE SEL)finishedSelector {
  GTMSessionCheckNotSynchronized(self);

  GTMSessionFetcherCompletionHandler handler =  [self completionHandlerWithTarget:target
                                                                didFinishSelector:finishedSelector];
  [self beginFetchWithCompletionHandler:handler];
}

- (void)beginFetchMayDelay:(BOOL)mayDelay
              mayAuthorize:(BOOL)mayAuthorize {
  // This is the internal entry point for re-starting fetches.
  GTMSessionCheckNotSynchronized(self);

  NSMutableURLRequest *fetchRequest = _request;  // The request property is now externally immutable.
  NSURL *fetchRequestURL = fetchRequest.URL;
  NSString *priorSessionIdentifier = self.sessionIdentifier;

  // A utility block for creating error objects when we fail to start the fetch.
  NSError *(^beginFailureError)(NSInteger) = ^(NSInteger code){
    NSString *urlString = fetchRequestURL.absoluteString;
    NSDictionary *userInfo = @{
      NSURLErrorFailingURLStringErrorKey : (urlString ? urlString : @"(missing URL)")
    };
    return [NSError errorWithDomain:kGTMSessionFetcherErrorDomain
                               code:code
                           userInfo:userInfo];
  };

  // Catch delegate queue maxConcurrentOperationCount values other than 1, particularly
  // NSOperationQueueDefaultMaxConcurrentOperationCount (-1), to avoid the additional complexity
  // of simultaneous or out-of-order delegate callbacks.
  GTMSESSION_ASSERT_DEBUG(_delegateQueue.maxConcurrentOperationCount == 1,
                          @"delegate queue %@ should support one concurrent operation, not %ld",
                          _delegateQueue.name,
                          (long)_delegateQueue.maxConcurrentOperationCount);

  if (!_initialBeginFetchDate) {
    // This ivar is set only here on the initial beginFetch so need not be synchronized.
    _initialBeginFetchDate = [[NSDate alloc] init];
  }

  if (self.sessionTask != nil) {
    // If cached fetcher returned through fetcherWithSessionIdentifier:, then it's
    // already begun, but don't consider this a failure, since the user need not know this.
    if (self.sessionIdentifier != nil) {
      return;
    }
    GTMSESSION_ASSERT_DEBUG(NO, @"Fetch object %@ being reused; this should never happen", self);
    [self failToBeginFetchWithError:beginFailureError(GTMSessionFetcherErrorDownloadFailed)];
    return;
  }

  if (fetchRequestURL == nil && !_downloadResumeData && !priorSessionIdentifier) {
    GTMSESSION_ASSERT_DEBUG(NO, @"Beginning a fetch requires a request with a URL");
    [self failToBeginFetchWithError:beginFailureError(GTMSessionFetcherErrorDownloadFailed)];
    return;
  }

  // We'll respect the user's request for a background session (unless this is
  // an upload fetcher, which does its initial request foreground.)
  self.usingBackgroundSession = self.useBackgroundSession && [self canFetchWithBackgroundSession];

  NSURL *bodyFileURL = self.bodyFileURL;
  if (bodyFileURL) {
    NSError *fileCheckError;
    if (![bodyFileURL checkResourceIsReachableAndReturnError:&fileCheckError]) {
      // This assert fires when the file being uploaded no longer exists once
      // the fetcher is ready to start the upload.
      GTMSESSION_ASSERT_DEBUG_OR_LOG(0, @"Body file is unreachable: %@\n  %@",
                                     bodyFileURL.path, fileCheckError);
      [self failToBeginFetchWithError:fileCheckError];
      return;
    }
  }

  NSString *requestScheme = fetchRequestURL.scheme;
  BOOL isDataRequest = [requestScheme isEqual:@"data"];
  if (isDataRequest) {
    // NSURLSession does not support data URLs in background sessions.
#if DEBUG
    if (priorSessionIdentifier || self.sessionIdentifier) {
      GTMSESSION_LOG_DEBUG(@"Converting background to foreground session for %@",
                           fetchRequest);
    }
#endif
    [self setSessionIdentifierInternal:nil];
    self.useBackgroundSession = NO;
  }

#if GTM_ALLOW_INSECURE_REQUESTS
  BOOL shouldCheckSecurity = NO;
#else
  BOOL shouldCheckSecurity = (fetchRequestURL != nil
                              && !isDataRequest
                              && [[self class] appAllowsInsecureRequests]);
#endif

  if (shouldCheckSecurity) {
    // Allow https only for requests, unless overridden by the client.
    //
    // Non-https requests may too easily be snooped, so we disallow them by default.
    //
    // file: and data: schemes are usually safe if they are hardcoded in the client or provided
    // by a trusted source, but since it's fairly rare to need them, it's safest to make clients
    // explicitly whitelist them.
    BOOL isSecure =
        requestScheme != nil && [requestScheme caseInsensitiveCompare:@"https"] == NSOrderedSame;
    if (!isSecure) {
      BOOL allowRequest = NO;
      NSString *host = fetchRequestURL.host;

      // Check schemes first.  A file scheme request may be allowed here, or as a localhost request.
      for (NSString *allowedScheme in _allowedInsecureSchemes) {
        if (requestScheme != nil &&
            [requestScheme caseInsensitiveCompare:allowedScheme] == NSOrderedSame) {
          allowRequest = YES;
          break;
        }
      }
      if (!allowRequest) {
        // Check for localhost requests.  Security checks only occur for non-https requests, so
        // this check won't happen for an https request to localhost.
        BOOL isLocalhostRequest = (host.length == 0 && [fetchRequestURL isFileURL]) || IsLocalhost(host);
        if (isLocalhostRequest) {
          if (self.allowLocalhostRequest) {
            allowRequest = YES;
          } else {
            GTMSESSION_ASSERT_DEBUG(NO, @"Fetch request for localhost but fetcher"
                                        @" allowLocalhostRequest is not set: %@", fetchRequestURL);
          }
        } else {
          GTMSESSION_ASSERT_DEBUG(NO, @"Insecure fetch request has a scheme (%@)"
                                      @" not found in fetcher allowedInsecureSchemes (%@): %@",
                                  requestScheme, _allowedInsecureSchemes ?: @" @[] ", fetchRequestURL);
        }
      }

      if (!allowRequest) {
#if !DEBUG
        NSLog(@"Insecure fetch disallowed for %@", fetchRequestURL.description ?: @"nil request URL");
#endif
        [self failToBeginFetchWithError:beginFailureError(GTMSessionFetcherErrorInsecureRequest)];
        return;
      }
    }  // !isSecure
  }  // (requestURL != nil) && !isDataRequest

  if (self.cookieStorage == nil) {
    self.cookieStorage = [[self class] staticCookieStorage];
  }

  BOOL isRecreatingSession = (self.sessionIdentifier != nil) && (fetchRequest == nil);

  self.canShareSession = !isRecreatingSession && !self.usingBackgroundSession;

  if (!self.session && self.canShareSession) {
    self.session = [_service sessionForFetcherCreation];
    // If _session is nil, then the service's session creation semaphore will block
    // until this fetcher invokes fetcherDidCreateSession: below, so this *must* invoke
    // that method, even if the session fails to be created.
  }

  if (!self.session) {
    // Create a session.
    if (!_configuration) {
      if (priorSessionIdentifier || self.usingBackgroundSession) {
        NSString *sessionIdentifier = priorSessionIdentifier;
        if (!sessionIdentifier) {
          sessionIdentifier = [self createSessionIdentifierWithMetadata:nil];
        }
        NSMapTable *sessionIdentifierToFetcherMap = [[self class] sessionIdentifierToFetcherMap];
        [sessionIdentifierToFetcherMap setObject:self forKey:self.sessionIdentifier];

#if (TARGET_OS_TV \
     || TARGET_OS_WATCH \
     || (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_10) && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_10) \
     || (TARGET_OS_IPHONE && defined(__IPHONE_8_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_8_0))
        // iOS 8/10.10 builds require the new backgroundSessionConfiguration method name.
        _configuration =
            [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:sessionIdentifier];
#elif (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_10) && MAC_OS_X_VERSION_MIN_REQUIRED < MAC_OS_X_VERSION_10_10) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_8_0) && __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0)
        // Do a runtime check to avoid a deprecation warning about using
        // +backgroundSessionConfiguration: on iOS 8.
        if ([NSURLSessionConfiguration respondsToSelector:@selector(backgroundSessionConfigurationWithIdentifier:)]) {
          // Running on iOS 8+/OS X 10.10+.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
// Disable unguarded availability warning as we can't use the @availability macro until we require
// all clients to build with Xcode 9 or above.
          _configuration =
              [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:sessionIdentifier];
#pragma clang diagnostic pop
        } else {
          // Running on iOS 7/OS X 10.9.
          _configuration =
              [NSURLSessionConfiguration backgroundSessionConfiguration:sessionIdentifier];
        }
#else
        // Building with an SDK earlier than iOS 8/OS X 10.10.
        _configuration =
            [NSURLSessionConfiguration backgroundSessionConfiguration:sessionIdentifier];
#endif
        self.usingBackgroundSession = YES;
        self.canShareSession = NO;
      } else {
        _configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
      }
#if !GTM_ALLOW_INSECURE_REQUESTS
      _configuration.TLSMinimumSupportedProtocol = kTLSProtocol12;
#endif
    }  // !_configuration
    _configuration.HTTPCookieStorage = self.cookieStorage;

    if (_configurationBlock) {
      _configurationBlock(self, _configuration);
    }

    id<NSURLSessionDelegate> delegate = [_service sessionDelegate];
    if (!delegate || !self.canShareSession) {
      delegate = self;
    }
    self.session = [NSURLSession sessionWithConfiguration:_configuration
                                                 delegate:delegate
                                            delegateQueue:self.sessionDelegateQueue];
    GTMSESSION_ASSERT_DEBUG(self.session, @"Couldn't create session");

    // Tell the service about the session created by this fetcher.  This also signals the
    // service's semaphore to allow other fetchers to request this session.
    [_service fetcherDidCreateSession:self];

    // If this assertion fires, the client probably tried to use a session identifier that was
    // already used. The solution is to make the client use a unique identifier (or better yet let
    // the session fetcher assign the identifier).
    GTMSESSION_ASSERT_DEBUG(self.session.delegate == delegate, @"Couldn't assign delegate.");

    if (self.session) {
      BOOL isUsingSharedDelegate = (delegate != self);
      if (!isUsingSharedDelegate) {
        _shouldInvalidateSession = YES;
      }
    }
  }

  if (isRecreatingSession) {
    _shouldInvalidateSession = YES;

    // Let's make sure there are tasks still running or if not that we get a callback from a
    // completed one; otherwise, we assume the tasks failed.
    // This is the observed behavior perhaps 25% of the time within the Simulator running 7.0.3 on
    // exiting the app after starting an upload and relaunching the app if we manage to relaunch
    // after the task has completed, but before the system relaunches us in the background.
    [self.session getTasksWithCompletionHandler:^(NSArray *dataTasks, NSArray *uploadTasks,
                                                  NSArray *downloadTasks) {
      if (dataTasks.count == 0 && uploadTasks.count == 0 && downloadTasks.count == 0) {
        double const kDelayInSeconds = 1.0;  // We should get progress indication or completion soon
        dispatch_time_t checkForFeedbackDelay =
            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kDelayInSeconds * NSEC_PER_SEC));
        dispatch_after(checkForFeedbackDelay, dispatch_get_main_queue(), ^{
          if (!self.sessionTask && !fetchRequest) {
            // If our task and/or request haven't been restored, then we assume task feedback lost.
            [self removePersistedBackgroundSessionFromDefaults];
            NSError *sessionError =
                [NSError errorWithDomain:kGTMSessionFetcherErrorDomain
                                    code:GTMSessionFetcherErrorBackgroundFetchFailed
                                userInfo:nil];
            [self failToBeginFetchWithError:sessionError];
          }
        });
      }
    }];
    return;
  }

  self.downloadedData = nil;
  self.downloadedLength = 0;

  if (_servicePriority == NSIntegerMin) {
    mayDelay = NO;
  }
  if (mayDelay && _service) {
    BOOL shouldFetchNow = [_service fetcherShouldBeginFetching:self];
    if (!shouldFetchNow) {
      // The fetch is deferred, but will happen later.
      //
      // If this session is held by the fetcher service, clear the session now so that we don't
      // assume it's still valid after the fetcher is restarted.
      if (self.canShareSession) {
        self.session = nil;
      }
      return;
    }
  }

  NSString *effectiveHTTPMethod = [fetchRequest valueForHTTPHeaderField:@"X-HTTP-Method-Override"];
  if (effectiveHTTPMethod == nil) {
    effectiveHTTPMethod = fetchRequest.HTTPMethod;
  }
  BOOL isEffectiveHTTPGet = (effectiveHTTPMethod == nil
                             || [effectiveHTTPMethod isEqual:@"GET"]);

  BOOL needsUploadTask = (self.useUploadTask || self.bodyFileURL || self.bodyStreamProvider);
  if (_bodyData || self.bodyStreamProvider || fetchRequest.HTTPBodyStream) {
    if (isEffectiveHTTPGet) {
      fetchRequest.HTTPMethod = @"POST";
      isEffectiveHTTPGet = NO;
    }

    if (_bodyData) {
      if (!needsUploadTask) {
        fetchRequest.HTTPBody = _bodyData;
      }
#if !STRIP_GTM_FETCH_LOGGING
    } else if (fetchRequest.HTTPBodyStream) {
      if ([self respondsToSelector:@selector(loggedInputStreamForInputStream:)]) {
        fetchRequest.HTTPBodyStream =
            [self performSelector:@selector(loggedInputStreamForInputStream:)
                       withObject:fetchRequest.HTTPBodyStream];
      }
#endif
    }
  }

  // We authorize after setting up the http method and body in the request
  // because OAuth 1 may need to sign the request body
  if (mayAuthorize && _authorizer && !isDataRequest) {
    BOOL isAuthorized = [_authorizer isAuthorizedRequest:fetchRequest];
    if (!isAuthorized) {
      // Authorization needed.
      //
      // If this session is held by the fetcher service, clear the session now so that we don't
      // assume it's still valid after authorization completes.
      if (self.canShareSession) {
        self.session = nil;
      }

      // Authorizing the request will recursively call this beginFetch:mayDelay:
      // or failToBeginFetchWithError:.
      [self authorizeRequest];
      return;
    }
  }

  // set the default upload or download retry interval, if necessary
  if ([self isRetryEnabled] && self.maxRetryInterval <= 0) {
    if (isEffectiveHTTPGet || [effectiveHTTPMethod isEqual:@"HEAD"]) {
      [self setMaxRetryInterval:kDefaultMaxDownloadRetryInterval];
    } else {
      [self setMaxRetryInterval:kDefaultMaxUploadRetryInterval];
    }
  }

  // finally, start the connection
  NSURLSessionTask *newSessionTask;
  BOOL needsDataAccumulator = NO;
  if (_downloadResumeData) {
    newSessionTask = [_session downloadTaskWithResumeData:_downloadResumeData];
    GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask,
        @"Failed downloadTaskWithResumeData for %@, resume data %lu bytes",
        _session, (unsigned long)_downloadResumeData.length);
  } else if (_destinationFileURL && !isDataRequest) {
    newSessionTask = [_session downloadTaskWithRequest:fetchRequest];
    GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask, @"Failed downloadTaskWithRequest for %@, %@",
                                   _session, fetchRequest);
  } else if (needsUploadTask) {
    if (bodyFileURL) {
      newSessionTask = [_session uploadTaskWithRequest:fetchRequest
                                              fromFile:bodyFileURL];
      GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask,
                                     @"Failed uploadTaskWithRequest for %@, %@, file %@",
                                     _session, fetchRequest, bodyFileURL.path);
    } else if (self.bodyStreamProvider) {
      newSessionTask = [_session uploadTaskWithStreamedRequest:fetchRequest];
      GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask,
                                     @"Failed uploadTaskWithStreamedRequest for %@, %@",
                                     _session, fetchRequest);
    } else {
      GTMSESSION_ASSERT_DEBUG_OR_LOG(_bodyData != nil,
                                     @"Upload task needs body data, %@", fetchRequest);
      newSessionTask = [_session uploadTaskWithRequest:fetchRequest
                                            fromData:(NSData * GTM_NONNULL_TYPE)_bodyData];
      GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask,
          @"Failed uploadTaskWithRequest for %@, %@, body data %lu bytes",
          _session, fetchRequest, (unsigned long)_bodyData.length);
    }
    needsDataAccumulator = YES;
  } else {
    newSessionTask = [_session dataTaskWithRequest:fetchRequest];
    needsDataAccumulator = YES;
    GTMSESSION_ASSERT_DEBUG_OR_LOG(newSessionTask, @"Failed dataTaskWithRequest for %@, %@",
                                   _session, fetchRequest);
  }
  self.sessionTask = newSessionTask;

  if (!newSessionTask) {
    // We shouldn't get here; if we're here, an earlier assertion should have fired to explain
    // which session task creation failed.
    [self failToBeginFetchWithError:beginFailureError(GTMSessionFetcherErrorTaskCreationFailed)];
    return;
  }

  if (needsDataAccumulator && _accumulateDataBlock == nil) {
    self.downloadedData = [NSMutableData data];
  }
  if (_taskDescription) {
    newSessionTask.taskDescription = _taskDescription;
  }
  if (_taskPriority >= 0) {
#if TARGET_OS_TV || TARGET_OS_WATCH
    BOOL hasTaskPriority = YES;
#elif (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_10) && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_10) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_8_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_8_0)
    BOOL hasTaskPriority = YES;
#else
    BOOL hasTaskPriority = [newSessionTask respondsToSelector:@selector(setPriority:)];
#endif
    if (hasTaskPriority) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
// Disable unguarded availability warning as we can't use the @availability macro until we require
// all clients to build with Xcode 9 or above.
      newSessionTask.priority = _taskPriority;
#pragma clang diagnostic pop
    }
  }

#if GTM_DISABLE_FETCHER_TEST_BLOCK
  GTMSESSION_ASSERT_DEBUG(_testBlock == nil && gGlobalTestBlock == nil, @"test blocks disabled");
  _testBlock = nil;
#else
  if (!_testBlock) {
    if (gGlobalTestBlock) {
      // Note that the test block may pass nil for all of its response parameters,
      // indicating that the fetch should actually proceed. This is useful when the
      // global test block has been set, and the app is only testing a specific
      // fetcher.  The block simulation code will then resume the task.
      _testBlock = gGlobalTestBlock;
    }
  }
  _isUsingTestBlock = (_testBlock != nil);
#endif  // GTM_DISABLE_FETCHER_TEST_BLOCK

#if GTM_BACKGROUND_TASK_FETCHING
  id<GTMUIApplicationProtocol> app = [[self class] fetcherUIApplication];
  // Background tasks seem to interfere with out-of-process uploads and downloads.
  if (app && !self.skipBackgroundTask && !self.useBackgroundSession) {
    // Tell UIApplication that we want to continue even when the app is in the
    // background.
#if DEBUG
    NSString *bgTaskName = [NSString stringWithFormat:@"%@-%@",
                            [self class], fetchRequest.URL.host];
#else
    NSString *bgTaskName = @"GTMSessionFetcher";
#endif
    __block UIBackgroundTaskIdentifier bgTaskID = [app beginBackgroundTaskWithName:bgTaskName
                                                                 expirationHandler:^{
      // Background task expiration callback - this block is always invoked by
      // UIApplication on the main thread.
      if (bgTaskID != UIBackgroundTaskInvalid) {
        @synchronized(self) {
          if (bgTaskID == self.backgroundTaskIdentifier) {
            self.backgroundTaskIdentifier = UIBackgroundTaskInvalid;
          }
        }
        [app endBackgroundTask:bgTaskID];
      }
    }];
    @synchronized(self) {
      self.backgroundTaskIdentifier = bgTaskID;
    }
  }
#endif

  if (!_initialRequestDate) {
    _initialRequestDate = [[NSDate alloc] init];
  }

  // We don't expect to reach here even on retry or auth until a stop notification has been sent
  // for the previous task, but we should ensure that we don't unbalance that.
  GTMSESSION_ASSERT_DEBUG(!_isStopNotificationNeeded, @"Start notification without a prior stop");
  [self sendStopNotificationIfNeeded];

  [self addPersistedBackgroundSessionToDefaults];

  [self setStopNotificationNeeded:YES];

  [self postNotificationOnMainThreadWithName:kGTMSessionFetcherStartedNotification
                                    userInfo:nil
                                requireAsync:NO];

  // The service needs to know our task if it is serving as NSURLSession delegate.
  [_service fetcherDidBeginFetching:self];

  if (_testBlock) {
#if !GTM_DISABLE_FETCHER_TEST_BLOCK
    [self simulateFetchForTestBlock];
#endif
  } else {
    // We resume the session task after posting the notification since the
    // delegate callbacks may happen immediately if the fetch is started off
    // the main thread or the session delegate queue is on a background thread,
    // and we don't want to post a start notification after a premature finish
    // of the session task.
    [newSessionTask resume];
  }
}

NSData * GTM_NULLABLE_TYPE GTMDataFromInputStream(NSInputStream *inputStream, NSError **outError) {
  NSMutableData *data = [NSMutableData data];

  [inputStream open];
  NSInteger numberOfBytesRead = 0;
  while ([inputStream hasBytesAvailable]) {
    uint8_t buffer[512];
    numberOfBytesRead = [inputStream read:buffer maxLength:sizeof(buffer)];
    if (numberOfBytesRead > 0) {
      [data appendBytes:buffer length:(NSUInteger)numberOfBytesRead];
    } else {
      break;
    }
  }
  [inputStream close];
  NSError *streamError = inputStream.streamError;

  if (streamError) {
    data = nil;
  }
  if (outError) {
    *outError = streamError;
  }
  return data;
}

#if !GTM_DISABLE_FETCHER_TEST_BLOCK

- (void)simulateFetchForTestBlock {
  // This is invoked on the same thread as the beginFetch method was.
  //
  // Callbacks will all occur on the callback queue.
  _testBlock(self, ^(NSURLResponse *response, NSData *responseData, NSError *error) {
      // Callback from test block.
      if (response == nil && responseData == nil && error == nil) {
        // Assume the fetcher should execute rather than be tested.
        self->_testBlock = nil;
        self->_isUsingTestBlock = NO;
        [self->_sessionTask resume];
        return;
      }

      GTMSessionFetcherBodyStreamProvider bodyStreamProvider = self.bodyStreamProvider;
      if (bodyStreamProvider) {
        bodyStreamProvider(^(NSInputStream *bodyStream){
          // Read from the input stream into an NSData buffer.  We'll drain the stream
          // explicitly on a background queue.
          [self invokeOnCallbackQueue:dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0)
                     afterUserStopped:NO
                                block:^{
            NSError *streamError;
            NSData *streamedData = GTMDataFromInputStream(bodyStream, &streamError);

            dispatch_async(dispatch_get_main_queue(), ^{
              // Continue callbacks on the main thread, since serial behavior
              // is more reliable for tests.
              [self simulateDataCallbacksForTestBlockWithBodyData:streamedData
                                                         response:response
                                                     responseData:responseData
                                                            error:(error ?: streamError)];
            });
          }];
        });
      } else {
        // No input stream; use the supplied data or file URL.
        NSURL *bodyFileURL = self.bodyFileURL;
        if (bodyFileURL) {
          NSError *readError;
          self->_bodyData = [NSData dataWithContentsOfURL:bodyFileURL
                                            options:NSDataReadingMappedIfSafe
                                              error:&readError];
          error = readError;
        }

        // No stream provider.

        // In real fetches, nothing happens until the run loop spins, so apps have leeway to
        // set callbacks after they call beginFetch. We'll mirror that fetcher behavior by
        // delaying callbacks here at least to the next spin of the run loop.  That keeps
        // immediate, synchronous setting of callback blocks after beginFetch working in tests.
        dispatch_async(dispatch_get_main_queue(), ^{
          [self simulateDataCallbacksForTestBlockWithBodyData:self->_bodyData
                                                     response:response
                                                 responseData:responseData
                                                        error:error];
        });
      }
    });
}

- (void)simulateByteTransferReportWithDataLength:(int64_t)totalDataLength
                                           block:(GTMSessionFetcherSendProgressBlock)block {
  // This utility method simulates transfer progress with up to three callbacks.
  // It is used to call back to any of the progress blocks.
  int64_t sendReportSize = totalDataLength / 3 + 1;
  int64_t totalSent = 0;
  while (totalSent < totalDataLength) {
    int64_t bytesRemaining = totalDataLength - totalSent;
    sendReportSize = MIN(sendReportSize, bytesRemaining);
    totalSent += sendReportSize;
    [self invokeOnCallbackQueueUnlessStopped:^{
        block(sendReportSize, totalSent, totalDataLength);
    }];
  }
}

- (void)simulateDataCallbacksForTestBlockWithBodyData:(NSData * GTM_NULLABLE_TYPE)bodyData
                                             response:(NSURLResponse *)response
                                         responseData:(NSData *)suppliedData
                                                error:(NSError *)suppliedError {
  __block NSData *responseData = suppliedData;
  __block NSError *responseError = suppliedError;

  // This method does the test simulation of callbacks once the upload
  // and download data are known.
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Get copies of ivars we'll access in async invocations.  This simulation assumes
    // they won't change during fetcher execution.
    NSURL *destinationFileURL = _destinationFileURL;
    GTMSessionFetcherWillRedirectBlock willRedirectBlock = _willRedirectBlock;
    GTMSessionFetcherDidReceiveResponseBlock didReceiveResponseBlock = _didReceiveResponseBlock;
    GTMSessionFetcherSendProgressBlock sendProgressBlock = _sendProgressBlock;
    GTMSessionFetcherDownloadProgressBlock downloadProgressBlock = _downloadProgressBlock;
    GTMSessionFetcherAccumulateDataBlock accumulateDataBlock = _accumulateDataBlock;
    GTMSessionFetcherReceivedProgressBlock receivedProgressBlock = _receivedProgressBlock;
    GTMSessionFetcherWillCacheURLResponseBlock willCacheURLResponseBlock =
        _willCacheURLResponseBlock;

    // Simulate receipt of redirection.
    if (willRedirectBlock) {
      [self invokeOnCallbackUnsynchronizedQueueAfterUserStopped:YES
                                                          block:^{
          willRedirectBlock((NSHTTPURLResponse *)response, self->_request,
                             ^(NSURLRequest *redirectRequest) {
              // For simulation, we'll assume the app will just continue.
          });
      }];
    }

    // If the fetcher has a challenge block, simulate a challenge.
    //
    // It might be nice to eventually let the user determine which testBlock
    // fetches get challenged rather than always executing the supplied
    // challenge block.
    if (_challengeBlock) {
      [self invokeOnCallbackUnsynchronizedQueueAfterUserStopped:YES
                                                          block:^{
        if (self->_challengeBlock) {
          NSURL *requestURL = self->_request.URL;
          NSString *host = requestURL.host;
          NSURLProtectionSpace *pspace =
              [[NSURLProtectionSpace alloc] initWithHost:host
                                                    port:requestURL.port.integerValue
                                                protocol:requestURL.scheme
                                                   realm:nil
                                    authenticationMethod:NSURLAuthenticationMethodHTTPBasic];
          id<NSURLAuthenticationChallengeSender> unusedSender =
              (id<NSURLAuthenticationChallengeSender>)[NSNull null];
          NSURLAuthenticationChallenge *challenge =
              [[NSURLAuthenticationChallenge alloc] initWithProtectionSpace:pspace
                                                         proposedCredential:nil
                                                       previousFailureCount:0
                                                            failureResponse:nil
                                                                      error:nil
                                                                     sender:unusedSender];
          self->_challengeBlock(self, challenge, ^(NSURLSessionAuthChallengeDisposition disposition,
                                             NSURLCredential * GTM_NULLABLE_TYPE credential){
            // We could change the responseData and responseError based on the disposition,
            // but it's easier for apps to just supply the expected data and error
            // directly to the test block. So this simulation ignores the disposition.
          });
        }
      }];
    }

    // Simulate receipt of an initial response.
    if (response && didReceiveResponseBlock) {
      [self invokeOnCallbackUnsynchronizedQueueAfterUserStopped:YES
                                                          block:^{
          didReceiveResponseBlock(response, ^(NSURLSessionResponseDisposition desiredDisposition) {
            // For simulation, we'll assume the disposition is to continue.
          });
      }];
    }

    // Simulate reporting send progress.
    if (sendProgressBlock) {
      [self simulateByteTransferReportWithDataLength:(int64_t)bodyData.length
                                               block:^(int64_t bytesSent,
                                                       int64_t totalBytesSent,
                                                       int64_t totalBytesExpectedToSend) {
          // This is invoked on the callback queue unless stopped.
          sendProgressBlock(bytesSent, totalBytesSent, totalBytesExpectedToSend);
      }];
    }

    if (destinationFileURL) {
      // Simulate download to file progress.
      if (downloadProgressBlock) {
        [self simulateByteTransferReportWithDataLength:(int64_t)responseData.length
                                                 block:^(int64_t bytesDownloaded,
                                                         int64_t totalBytesDownloaded,
                                                         int64_t totalBytesExpectedToDownload) {
            // This is invoked on the callback queue unless stopped.
            downloadProgressBlock(bytesDownloaded, totalBytesDownloaded,
                                  totalBytesExpectedToDownload);
        }];
      }

      NSError *writeError;
      [responseData writeToURL:destinationFileURL
                       options:NSDataWritingAtomic
                         error:&writeError];
      if (writeError) {
        // Tell the test code that writing failed.
        responseError = writeError;
      }
    } else {
      // Simulate download to NSData progress.
      if ((accumulateDataBlock || receivedProgressBlock) && responseData) {
        [self simulateByteTransferWithData:responseData
                                     block:^(NSData *data,
                                             int64_t bytesReceived,
                                             int64_t totalBytesReceived,
                                             int64_t totalBytesExpectedToReceive) {
          // This is invoked on the callback queue unless stopped.
          if (accumulateDataBlock) {
            accumulateDataBlock(data);
          }

          if (receivedProgressBlock) {
            receivedProgressBlock(bytesReceived, totalBytesReceived);
          }
        }];
      }

      if (!accumulateDataBlock) {
        _downloadedData = [responseData mutableCopy];
      }

      if (willCacheURLResponseBlock) {
        // Simulate letting the client inspect and alter the cached response.
        NSData *cachedData = responseData ?: [[NSData alloc] init];  // Always have non-nil data.
        NSCachedURLResponse *cachedResponse =
            [[NSCachedURLResponse alloc] initWithResponse:response
                                                     data:cachedData];
        [self invokeOnCallbackUnsynchronizedQueueAfterUserStopped:YES
                                                            block:^{
            willCacheURLResponseBlock(cachedResponse, ^(NSCachedURLResponse *responseToCache){
                // The app may provide an alternative response, or nil to defeat caching.
            });
        }];
      }
    }
    _response = response;
  }  // @synchronized(self)

  NSOperationQueue *queue = self.sessionDelegateQueue;
  [queue addOperationWithBlock:^{
    // Rather than invoke failToBeginFetchWithError: we want to simulate completion of
    // a connection that started and ended, so we'll call down to finishWithError:
    NSInteger status = responseError ? responseError.code : 200;
    if (status >= 200 && status <= 399) {
      [self finishWithError:nil shouldRetry:NO];
    } else {
      [self shouldRetryNowForStatus:status
                              error:responseError
                   forceAssumeRetry:NO
                           response:^(BOOL shouldRetry) {
          [self finishWithError:responseError shouldRetry:shouldRetry];
      }];
    }
  }];
}

- (void)simulateByteTransferWithData:(NSData *)responseData
                               block:(GTMSessionFetcherSimulateByteTransferBlock)transferBlock {
  // This utility method simulates transfering data to the client. It divides the data into at most
  // "chunkCount" chunks and then passes each chunk along with a progress update to transferBlock.
  // This function can be used with accumulateDataBlock or receivedProgressBlock.

  NSUInteger chunkCount = MAX(self.testBlockAccumulateDataChunkCount, (NSUInteger) 1);
  NSUInteger totalDataLength = responseData.length;
  NSUInteger sendDataSize = totalDataLength / chunkCount + 1;
  NSUInteger totalSent = 0;
  while (totalSent < totalDataLength) {
    NSUInteger bytesRemaining = totalDataLength - totalSent;
    sendDataSize = MIN(sendDataSize, bytesRemaining);
    NSData *chunkData = [responseData subdataWithRange:NSMakeRange(totalSent, sendDataSize)];
    totalSent += sendDataSize;
    [self invokeOnCallbackQueueUnlessStopped:^{
      transferBlock(chunkData,
                    (int64_t)sendDataSize,
                    (int64_t)totalSent,
                    (int64_t)totalDataLength);
    }];
  }
}

#endif  // !GTM_DISABLE_FETCHER_TEST_BLOCK

- (void)setSessionTask:(NSURLSessionTask *)sessionTask {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_sessionTask != sessionTask) {
      _sessionTask = sessionTask;
      if (_sessionTask) {
        // Request could be nil on restoring this fetcher from a background session.
        if (!_request) {
          _request = [_sessionTask.originalRequest mutableCopy];
        }
      }
    }
  }  // @synchronized(self)
}

- (NSURLSessionTask * GTM_NULLABLE_TYPE)sessionTask {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _sessionTask;
  }  // @synchronized(self)
}

+ (NSUserDefaults *)fetcherUserDefaults {
  static NSUserDefaults *gFetcherUserDefaults = nil;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class fetcherUserDefaultsClass = NSClassFromString(@"GTMSessionFetcherUserDefaultsFactory");
    if (fetcherUserDefaultsClass) {
      gFetcherUserDefaults = [fetcherUserDefaultsClass fetcherUserDefaults];
    } else {
      gFetcherUserDefaults = [NSUserDefaults standardUserDefaults];
    }
  });
  return gFetcherUserDefaults;
}

- (void)addPersistedBackgroundSessionToDefaults {
  NSString *sessionIdentifier = self.sessionIdentifier;
  if (!sessionIdentifier) {
    return;
  }
  NSArray *oldBackgroundSessions = [[self class] activePersistedBackgroundSessions];
  if ([oldBackgroundSessions containsObject:_sessionIdentifier]) {
    return;
  }
  NSMutableArray *newBackgroundSessions =
      [NSMutableArray arrayWithArray:oldBackgroundSessions];
  [newBackgroundSessions addObject:sessionIdentifier];
  GTM_LOG_BACKGROUND_SESSION(@"Add to background sessions: %@", newBackgroundSessions);

  NSUserDefaults *userDefaults = [[self class] fetcherUserDefaults];
  [userDefaults setObject:newBackgroundSessions
                   forKey:kGTMSessionFetcherPersistedDestinationKey];
  [userDefaults synchronize];
}

- (void)removePersistedBackgroundSessionFromDefaults {
  NSString *sessionIdentifier = self.sessionIdentifier;
  if (!sessionIdentifier) return;

  NSArray *oldBackgroundSessions = [[self class] activePersistedBackgroundSessions];
  if (!oldBackgroundSessions) {
    return;
  }
  NSMutableArray *newBackgroundSessions =
      [NSMutableArray arrayWithArray:oldBackgroundSessions];
  NSUInteger sessionIndex = [newBackgroundSessions indexOfObject:sessionIdentifier];
  if (sessionIndex == NSNotFound) {
    return;
  }
  [newBackgroundSessions removeObjectAtIndex:sessionIndex];
  GTM_LOG_BACKGROUND_SESSION(@"Remove from background sessions: %@", newBackgroundSessions);

  NSUserDefaults *userDefaults = [[self class] fetcherUserDefaults];
  if (newBackgroundSessions.count == 0) {
    [userDefaults removeObjectForKey:kGTMSessionFetcherPersistedDestinationKey];
  } else {
    [userDefaults setObject:newBackgroundSessions
                     forKey:kGTMSessionFetcherPersistedDestinationKey];
  }
  [userDefaults synchronize];
}

+ (GTM_NULLABLE NSArray *)activePersistedBackgroundSessions {
  NSUserDefaults *userDefaults = [[self class] fetcherUserDefaults];
  NSArray *oldBackgroundSessions =
      [userDefaults arrayForKey:kGTMSessionFetcherPersistedDestinationKey];
  if (oldBackgroundSessions.count == 0) {
    return nil;
  }
  NSMutableArray *activeBackgroundSessions = nil;
  NSMapTable *sessionIdentifierToFetcherMap = [self sessionIdentifierToFetcherMap];
  for (NSString *sessionIdentifier in oldBackgroundSessions) {
    GTMSessionFetcher *fetcher = [sessionIdentifierToFetcherMap objectForKey:sessionIdentifier];
    if (fetcher) {
      if (!activeBackgroundSessions) {
        activeBackgroundSessions = [[NSMutableArray alloc] init];
      }
      [activeBackgroundSessions addObject:sessionIdentifier];
    }
  }
  return activeBackgroundSessions;
}

+ (NSArray *)fetchersForBackgroundSessions {
  NSUserDefaults *userDefaults = [[self class] fetcherUserDefaults];
  NSArray *backgroundSessions =
      [userDefaults arrayForKey:kGTMSessionFetcherPersistedDestinationKey];
  NSMapTable *sessionIdentifierToFetcherMap = [self sessionIdentifierToFetcherMap];
  NSMutableArray *fetchers = [NSMutableArray array];
  for (NSString *sessionIdentifier in backgroundSessions) {
    GTMSessionFetcher *fetcher = [sessionIdentifierToFetcherMap objectForKey:sessionIdentifier];
    if (!fetcher) {
      fetcher = [self fetcherWithSessionIdentifier:sessionIdentifier];
      GTMSESSION_ASSERT_DEBUG(fetcher != nil,
                              @"Unexpected invalid session identifier: %@", sessionIdentifier);
      [fetcher beginFetchWithCompletionHandler:nil];
    }
    GTM_LOG_BACKGROUND_SESSION(@"%@ restoring session %@ by creating fetcher %@ %p",
                               [self class], sessionIdentifier, fetcher, fetcher);
    if (fetcher != nil) {
      [fetchers addObject:fetcher];
    }
  }
  return fetchers;
}

#if TARGET_OS_IPHONE && !TARGET_OS_WATCH
+ (void)application:(UIApplication *)application
    handleEventsForBackgroundURLSession:(NSString *)identifier
                      completionHandler:(GTMSessionFetcherSystemCompletionHandler)completionHandler {
  GTMSessionFetcher *fetcher = [self fetcherWithSessionIdentifier:identifier];
  if (fetcher != nil) {
    fetcher.systemCompletionHandler = completionHandler;
  } else {
    GTM_LOG_BACKGROUND_SESSION(@"%@ did not create background session identifier: %@",
                               [self class], identifier);
  }
}
#endif

- (NSString * GTM_NULLABLE_TYPE)sessionIdentifier {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _sessionIdentifier;
  }  // @synchronized(self)
}

- (void)setSessionIdentifier:(NSString *)sessionIdentifier {
  GTMSESSION_ASSERT_DEBUG(sessionIdentifier != nil, @"Invalid session identifier");
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSESSION_ASSERT_DEBUG(!_session, @"Unable to set session identifier after session created");
    _sessionIdentifier = [sessionIdentifier copy];
    _usingBackgroundSession = YES;
    _canShareSession = NO;
    [self restoreDefaultStateForSessionIdentifierMetadata];
  }  // @synchronized(self)
}

- (void)setSessionIdentifierInternal:(GTM_NULLABLE NSString *)sessionIdentifier {
  // This internal method only does a synchronized set of the session identifier.
  // It does not have side effects on the background session, shared session, or
  // session identifier metadata.
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _sessionIdentifier = [sessionIdentifier copy];
  }  // @synchronized(self)
}

- (NSDictionary * GTM_NULLABLE_TYPE)sessionUserInfo {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_sessionUserInfo == nil) {
      // We'll return the metadata dictionary with internal keys removed. This avoids the user
      // re-using the userInfo dictionary later and accidentally including the internal keys.
      NSMutableDictionary *metadata = [[self sessionIdentifierMetadataUnsynchronized] mutableCopy];
      NSSet *keysToRemove = [metadata keysOfEntriesPassingTest:^BOOL(id key, id obj, BOOL *stop) {
          return [key hasPrefix:@"_"];
      }];
      [metadata removeObjectsForKeys:[keysToRemove allObjects]];
      if (metadata.count > 0) {
        _sessionUserInfo = metadata;
      }
    }
    return _sessionUserInfo;
  }  // @synchronized(self)
}

- (void)setSessionUserInfo:(NSDictionary * GTM_NULLABLE_TYPE)dictionary {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSESSION_ASSERT_DEBUG(_sessionIdentifier == nil, @"Too late to assign userInfo");
    _sessionUserInfo = dictionary;
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSDictionary *)sessionIdentifierDefaultMetadata {
  GTMSessionCheckSynchronized(self);

  NSMutableDictionary *defaultUserInfo = [[NSMutableDictionary alloc] init];
  if (_destinationFileURL) {
    defaultUserInfo[kGTMSessionIdentifierDestinationFileURLMetadataKey] =
        [_destinationFileURL absoluteString];
  }
  if (_bodyFileURL) {
    defaultUserInfo[kGTMSessionIdentifierBodyFileURLMetadataKey] = [_bodyFileURL absoluteString];
  }
  return (defaultUserInfo.count > 0) ? defaultUserInfo : nil;
}

- (void)restoreDefaultStateForSessionIdentifierMetadata {
  GTMSessionCheckSynchronized(self);

  NSDictionary *metadata = [self sessionIdentifierMetadataUnsynchronized];
  NSString *destinationFileURLString = metadata[kGTMSessionIdentifierDestinationFileURLMetadataKey];
  if (destinationFileURLString) {
    _destinationFileURL = [NSURL URLWithString:destinationFileURLString];
    GTM_LOG_BACKGROUND_SESSION(@"Restoring destination file URL: %@", _destinationFileURL);
  }
  NSString *bodyFileURLString = metadata[kGTMSessionIdentifierBodyFileURLMetadataKey];
  if (bodyFileURLString) {
    _bodyFileURL = [NSURL URLWithString:bodyFileURLString];
    GTM_LOG_BACKGROUND_SESSION(@"Restoring body file URL: %@", _bodyFileURL);
  }
}

- (NSDictionary * GTM_NULLABLE_TYPE)sessionIdentifierMetadata {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [self sessionIdentifierMetadataUnsynchronized];
  }
}

- (NSDictionary * GTM_NULLABLE_TYPE)sessionIdentifierMetadataUnsynchronized {
  GTMSessionCheckSynchronized(self);

  // Session Identifier format: "com.google.<ClassName>_<UUID>_<Metadata in JSON format>
  if (!_sessionIdentifier) {
    return nil;
  }
  NSScanner *metadataScanner = [NSScanner scannerWithString:_sessionIdentifier];
  [metadataScanner setCharactersToBeSkipped:nil];
  NSString *metadataString;
  NSString *uuid;
  if ([metadataScanner scanUpToString:@"_" intoString:NULL] &&
      [metadataScanner scanString:@"_" intoString:NULL] &&
      [metadataScanner scanUpToString:@"_" intoString:&uuid] &&
      [metadataScanner scanString:@"_" intoString:NULL] &&
      [metadataScanner scanUpToString:@"\n" intoString:&metadataString]) {
    _sessionIdentifierUUID = uuid;
    NSData *metadataData = [metadataString dataUsingEncoding:NSUTF8StringEncoding];
    NSError *error;
    NSDictionary *metadataDict =
      [NSJSONSerialization JSONObjectWithData:metadataData
                                      options:0
                                        error:&error];
    GTM_LOG_BACKGROUND_SESSION(@"User Info from session identifier: %@ %@",
                               metadataDict, error ? error : @"");
    return metadataDict;
  }
  return nil;
}

- (NSString *)createSessionIdentifierWithMetadata:(NSDictionary * GTM_NULLABLE_TYPE)metadataToInclude {
  NSString *result;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Session Identifier format: "com.google.<ClassName>_<UUID>_<Metadata in JSON format>
    GTMSESSION_ASSERT_DEBUG(!_sessionIdentifier, @"Session identifier already created");
    _sessionIdentifierUUID = [[NSUUID UUID] UUIDString];
    _sessionIdentifier =
      [NSString stringWithFormat:@"%@_%@", kGTMSessionIdentifierPrefix, _sessionIdentifierUUID];
    // Start with user-supplied keys so they cannot accidentally override the fetcher's keys.
    NSMutableDictionary *metadataDict =
        [NSMutableDictionary dictionaryWithDictionary:(NSDictionary * GTM_NONNULL_TYPE)_sessionUserInfo];

    if (metadataToInclude) {
      [metadataDict addEntriesFromDictionary:(NSDictionary *)metadataToInclude];
    }
    NSDictionary *defaultMetadataDict = [self sessionIdentifierDefaultMetadata];
    if (defaultMetadataDict) {
      [metadataDict addEntriesFromDictionary:defaultMetadataDict];
    }
    if (metadataDict.count > 0) {
      NSData *metadataData = [NSJSONSerialization dataWithJSONObject:metadataDict
                                                             options:0
                                                               error:NULL];
      GTMSESSION_ASSERT_DEBUG(metadataData != nil,
                              @"Session identifier user info failed to convert to JSON");
      if (metadataData.length > 0) {
        NSString *metadataString = [[NSString alloc] initWithData:metadataData
                                                         encoding:NSUTF8StringEncoding];
        _sessionIdentifier =
          [_sessionIdentifier stringByAppendingFormat:@"_%@", metadataString];
      }
    }
    _didCreateSessionIdentifier = YES;
    result = _sessionIdentifier;
  }  // @synchronized(self)
  return result;
}

- (void)failToBeginFetchWithError:(NSError *)error {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _hasStoppedFetching = YES;
  }

  if (error == nil) {
    error = [NSError errorWithDomain:kGTMSessionFetcherErrorDomain
                                code:GTMSessionFetcherErrorDownloadFailed
                            userInfo:nil];
  }

  [self invokeFetchCallbacksOnCallbackQueueWithData:nil
                                              error:error];
  [self releaseCallbacks];

  [_service fetcherDidStop:self];

  self.authorizer = nil;
}

+ (GTMSessionCookieStorage *)staticCookieStorage {
  static GTMSessionCookieStorage *gCookieStorage = nil;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gCookieStorage = [[GTMSessionCookieStorage alloc] init];
  });
  return gCookieStorage;
}

#if GTM_BACKGROUND_TASK_FETCHING

- (void)endBackgroundTask {
  // Whenever the connection stops or background execution expires,
  // we need to tell UIApplication we're done.
  UIBackgroundTaskIdentifier bgTaskID;
  @synchronized(self) {
    bgTaskID = self.backgroundTaskIdentifier;
    if (bgTaskID != UIBackgroundTaskInvalid) {
      self.backgroundTaskIdentifier = UIBackgroundTaskInvalid;
    }
  }

  if (bgTaskID != UIBackgroundTaskInvalid) {
    id<GTMUIApplicationProtocol> app = [[self class] fetcherUIApplication];
    [app endBackgroundTask:bgTaskID];
  }
}

#endif // GTM_BACKGROUND_TASK_FETCHING

- (void)authorizeRequest {
  GTMSessionCheckNotSynchronized(self);

  id authorizer = self.authorizer;
  SEL asyncAuthSel = @selector(authorizeRequest:delegate:didFinishSelector:);
  if ([authorizer respondsToSelector:asyncAuthSel]) {
    SEL callbackSel = @selector(authorizer:request:finishedWithError:);
    NSMutableURLRequest *mutableRequest = [self.request mutableCopy];
    [authorizer authorizeRequest:mutableRequest
                        delegate:self
               didFinishSelector:callbackSel];
  } else {
    GTMSESSION_ASSERT_DEBUG(authorizer == nil, @"invalid authorizer for fetch");

    // No authorizing possible, and authorizing happens only after any delay;
    // just begin fetching
    [self beginFetchMayDelay:NO
                mayAuthorize:NO];
  }
}

- (void)authorizer:(id<GTMFetcherAuthorizationProtocol>)auth
           request:(NSMutableURLRequest *)authorizedRequest
 finishedWithError:(NSError *)error {
  GTMSessionCheckNotSynchronized(self);

  if (error != nil) {
    // We can't fetch without authorization
    [self failToBeginFetchWithError:error];
  } else {
    @synchronized(self) {
      _request = authorizedRequest;
    }
    [self beginFetchMayDelay:NO
                mayAuthorize:NO];
  }
}


- (BOOL)canFetchWithBackgroundSession {
  // Subclasses may override.
  return YES;
}

// Returns YES if the fetcher has been started and has not yet stopped.
//
// Fetching includes waiting for authorization or for retry, waiting to be allowed by the
// service object to start the request, and actually fetching the request.
- (BOOL)isFetching {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [self isFetchingUnsynchronized];
  }
}

- (BOOL)isFetchingUnsynchronized {
  GTMSessionCheckSynchronized(self);

  BOOL hasBegun = (_initialBeginFetchDate != nil);
  return hasBegun && !_hasStoppedFetching;
}

- (NSURLResponse * GTM_NULLABLE_TYPE)response {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSURLResponse *response = [self responseUnsynchronized];
    return response;
  }  // @synchronized(self)
}

- (NSURLResponse * GTM_NULLABLE_TYPE)responseUnsynchronized {
  GTMSessionCheckSynchronized(self);

  NSURLResponse *response = _sessionTask.response;
  if (!response) response = _response;
  return response;
}

- (NSInteger)statusCode {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSInteger statusCode = [self statusCodeUnsynchronized];
    return statusCode;
  }  // @synchronized(self)
}

- (NSInteger)statusCodeUnsynchronized {
  GTMSessionCheckSynchronized(self);

  NSURLResponse *response = [self responseUnsynchronized];
  NSInteger statusCode;

  if ([response respondsToSelector:@selector(statusCode)]) {
    statusCode = [(NSHTTPURLResponse *)response statusCode];
  } else {
    //  Default to zero, in hopes of hinting "Unknown" (we can't be
    //  sure that things are OK enough to use 200).
    statusCode = 0;
  }
  return statusCode;
}

- (NSDictionary * GTM_NULLABLE_TYPE)responseHeaders {
  GTMSessionCheckNotSynchronized(self);

  NSURLResponse *response = self.response;
  if ([response respondsToSelector:@selector(allHeaderFields)]) {
    NSDictionary *headers = [(NSHTTPURLResponse *)response allHeaderFields];
    return headers;
  }
  return nil;
}

- (NSDictionary * GTM_NULLABLE_TYPE)responseHeadersUnsynchronized {
  GTMSessionCheckSynchronized(self);

  NSURLResponse *response = [self responseUnsynchronized];
  if ([response respondsToSelector:@selector(allHeaderFields)]) {
    NSDictionary *headers = [(NSHTTPURLResponse *)response allHeaderFields];
    return headers;
  }
  return nil;
}

- (void)releaseCallbacks {
  // Avoid releasing blocks in the sync section since objects dealloc'd by
  // the blocks being released may call back into the fetcher or fetcher
  // service.
  dispatch_queue_t NS_VALID_UNTIL_END_OF_SCOPE holdCallbackQueue;
  GTMSessionFetcherCompletionHandler NS_VALID_UNTIL_END_OF_SCOPE holdCompletionHandler;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    holdCallbackQueue = _callbackQueue;
    holdCompletionHandler = _completionHandler;

    _callbackQueue = nil;
    _completionHandler = nil;  // Setter overridden in upload. Setter assumed to be used externally.
  }

  // Set local callback pointers to nil here rather than let them release at the end of the scope
  // to make any problems due to the blocks being released be a bit more obvious in a stack trace.
  holdCallbackQueue = nil;
  holdCompletionHandler = nil;

  self.configurationBlock = nil;
  self.didReceiveResponseBlock = nil;
  self.challengeBlock = nil;
  self.willRedirectBlock = nil;
  self.sendProgressBlock = nil;
  self.receivedProgressBlock = nil;
  self.downloadProgressBlock = nil;
  self.accumulateDataBlock = nil;
  self.willCacheURLResponseBlock = nil;
  self.retryBlock = nil;
  self.testBlock = nil;
  self.resumeDataBlock = nil;
}

- (void)forgetSessionIdentifierForFetcher {
  GTMSessionCheckSynchronized(self);
  [self forgetSessionIdentifierForFetcherWithoutSyncCheck];
}

- (void)forgetSessionIdentifierForFetcherWithoutSyncCheck {
  // This should be called inside a @synchronized block (except during dealloc.)
  if (_sessionIdentifier) {
    NSMapTable *sessionIdentifierToFetcherMap = [[self class] sessionIdentifierToFetcherMap];
    [sessionIdentifierToFetcherMap removeObjectForKey:_sessionIdentifier];
    _sessionIdentifier = nil;
    _didCreateSessionIdentifier = NO;
  }
}

// External stop method
- (void)stopFetching {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Prevent enqueued callbacks from executing.
    _userStoppedFetching = YES;
  }  // @synchronized(self)
  [self stopFetchReleasingCallbacks:YES];
}

// Cancel the fetch of the URL that's currently in progress.
//
// If shouldReleaseCallbacks is NO then the fetch will be retried so the callbacks
// need to still be retained.
- (void)stopFetchReleasingCallbacks:(BOOL)shouldReleaseCallbacks {
  [self removePersistedBackgroundSessionFromDefaults];

  id<GTMSessionFetcherServiceProtocol> service;
  NSMutableURLRequest *request;

  // If the task or the retry timer is all that's retaining the fetcher,
  // we want to be sure this instance survives stopping at least long enough for
  // the stack to unwind.
  __autoreleasing GTMSessionFetcher *holdSelf = self;

  BOOL hasCanceledTask = NO;

  [holdSelf destroyRetryTimer];

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _hasStoppedFetching = YES;

    service = _service;
    request = _request;

    if (_sessionTask) {
      // In case cancelling the task or session calls this recursively, we want
      // to ensure that we'll only release the task and delegate once,
      // so first set _sessionTask to nil
      //
      // This may be called in a callback from the task, so use autorelease to avoid
      // releasing the task in its own callback.
      __autoreleasing NSURLSessionTask *oldTask = _sessionTask;
      if (!_isUsingTestBlock) {
        _response = _sessionTask.response;
      }
      _sessionTask = nil;

      if ([oldTask state] != NSURLSessionTaskStateCompleted) {
        // For download tasks, when the fetch is stopped, we may provide resume data that can
        // be used to create a new session.
        BOOL mayResume = (_resumeDataBlock
                          && [oldTask respondsToSelector:@selector(cancelByProducingResumeData:)]);
        if (!mayResume) {
          [oldTask cancel];
          // A side effect of stopping the task is that URLSession:task:didCompleteWithError:
          // will be invoked asynchronously on the delegate queue.
        } else {
          void (^resumeBlock)(NSData *) = _resumeDataBlock;
          _resumeDataBlock = nil;

          // Save callbackQueue since releaseCallbacks clears it.
          dispatch_queue_t callbackQueue = _callbackQueue;
          dispatch_group_enter(_callbackGroup);
          [(NSURLSessionDownloadTask *)oldTask cancelByProducingResumeData:^(NSData *resumeData) {
              [self invokeOnCallbackQueue:callbackQueue
                         afterUserStopped:YES
                                    block:^{
                  resumeBlock(resumeData);
                  dispatch_group_leave(self->_callbackGroup);
              }];
          }];
        }
        hasCanceledTask = YES;
      }
    }

    // If the task was canceled, wait until the URLSession:task:didCompleteWithError: to call
    // finishTasksAndInvalidate, since calling it immediately tends to crash, see radar 18471901.
    if (_session) {
      BOOL shouldInvalidate = _shouldInvalidateSession;
#if TARGET_OS_IPHONE
      // Don't invalidate if we've got a systemCompletionHandler, since
      // URLSessionDidFinishEventsForBackgroundURLSession: won't be called if invalidated.
      shouldInvalidate = shouldInvalidate && !self.systemCompletionHandler;
#endif
      if (shouldInvalidate) {
        __autoreleasing NSURLSession *oldSession = _session;
        _session = nil;

        if (!hasCanceledTask) {
          [oldSession finishTasksAndInvalidate];
        } else {
          _sessionNeedingInvalidation = oldSession;
        }
      }
    }
  }  // @synchronized(self)

  // send the stopped notification
  [self sendStopNotificationIfNeeded];

  [_authorizer stopAuthorizationForRequest:request];

  if (shouldReleaseCallbacks) {
    [self releaseCallbacks];

    self.authorizer = nil;
  }

  [service fetcherDidStop:self];

#if GTM_BACKGROUND_TASK_FETCHING
  [self endBackgroundTask];
#endif
}

- (void)setStopNotificationNeeded:(BOOL)flag {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _isStopNotificationNeeded = flag;
  }  // @synchronized(self)
}

- (void)sendStopNotificationIfNeeded {
  BOOL sendNow = NO;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_isStopNotificationNeeded) {
      _isStopNotificationNeeded = NO;
      sendNow = YES;
    }
  }  // @synchronized(self)

  if (sendNow) {
    [self postNotificationOnMainThreadWithName:kGTMSessionFetcherStoppedNotification
                                      userInfo:nil
                                  requireAsync:NO];
  }
}

- (void)retryFetch {
  [self stopFetchReleasingCallbacks:NO];

  // A retry will need a configuration with a fresh session identifier.
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_sessionIdentifier && _didCreateSessionIdentifier) {
      [self forgetSessionIdentifierForFetcher];
      _configuration = nil;
    }

    if (_canShareSession) {
      // Force a grab of the current session from the fetcher service in case
      // the service's old one has become invalid.
      _session = nil;
    }
  }  // @synchronized(self)

  [self beginFetchForRetry];
}

- (BOOL)waitForCompletionWithTimeout:(NSTimeInterval)timeoutInSeconds {
  // Uncovered in upload fetcher testing, because the chunk fetcher is being waited on, and gets
  // released by the upload code. The uploader just holds onto it with an ivar, and that gets
  // nilled in the chunk fetcher callback.
  // Used once in while loop just to avoid unused variable compiler warning.
  __autoreleasing GTMSessionFetcher *holdSelf = self;

  NSDate *giveUpDate = [NSDate dateWithTimeIntervalSinceNow:timeoutInSeconds];

  BOOL shouldSpinRunLoop = ([NSThread isMainThread] &&
                            (!self.callbackQueue
                             || self.callbackQueue == dispatch_get_main_queue()));
  BOOL expired = NO;

  // Loop until the callbacks have been called and released, and until
  // the connection is no longer pending, until there are no callback dispatches
  // in flight, or until the timeout has expired.
  int64_t delta = (int64_t)(100 * NSEC_PER_MSEC);  // 100 ms
  while (1) {
    BOOL isTaskInProgress = (holdSelf->_sessionTask
                             && [_sessionTask state] != NSURLSessionTaskStateCompleted);
    BOOL needsToCallCompletion = (_completionHandler != nil);
    BOOL isCallbackInProgress = (_callbackGroup
        && dispatch_group_wait(_callbackGroup, dispatch_time(DISPATCH_TIME_NOW, delta)));

    if (!isTaskInProgress && !needsToCallCompletion && !isCallbackInProgress) break;

    expired = ([giveUpDate timeIntervalSinceNow] < 0);
    if (expired) {
      GTMSESSION_LOG_DEBUG(@"GTMSessionFetcher waitForCompletionWithTimeout:%0.1f expired -- "
                           @"%@%@%@", timeoutInSeconds,
                           isTaskInProgress ? @"taskInProgress " : @"",
                           needsToCallCompletion ? @"needsToCallCompletion " : @"",
                           isCallbackInProgress ? @"isCallbackInProgress" : @"");
      break;
    }

    // Run the current run loop 1/1000 of a second to give the networking
    // code a chance to work
    const NSTimeInterval kSpinInterval = 0.001;
    if (shouldSpinRunLoop) {
      NSDate *stopDate = [NSDate dateWithTimeIntervalSinceNow:kSpinInterval];
      [[NSRunLoop currentRunLoop] runUntilDate:stopDate];
    } else {
      [NSThread sleepForTimeInterval:kSpinInterval];
    }
  }
  return !expired;
}

+ (void)setGlobalTestBlock:(GTMSessionFetcherTestBlock GTM_NULLABLE_TYPE)block {
#if GTM_DISABLE_FETCHER_TEST_BLOCK
  GTMSESSION_ASSERT_DEBUG(block == nil, @"test blocks disabled");
#endif
  gGlobalTestBlock = [block copy];
}

#if GTM_BACKGROUND_TASK_FETCHING

static GTM_NULLABLE_TYPE id<GTMUIApplicationProtocol> gSubstituteUIApp;

+ (void)setSubstituteUIApplication:(nullable id<GTMUIApplicationProtocol>)app {
  gSubstituteUIApp = app;
}

+ (nullable id<GTMUIApplicationProtocol>)substituteUIApplication {
  return gSubstituteUIApp;
}

+ (nullable id<GTMUIApplicationProtocol>)fetcherUIApplication {
  id<GTMUIApplicationProtocol> app = gSubstituteUIApp;
  if (app) return app;

  // iOS App extensions should not call [UIApplication sharedApplication], even
  // if UIApplication responds to it.

  static Class applicationClass = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    BOOL isAppExtension = [[[NSBundle mainBundle] bundlePath] hasSuffix:@".appex"];
    if (!isAppExtension) {
      Class cls = NSClassFromString(@"UIApplication");
      if (cls && [cls respondsToSelector:NSSelectorFromString(@"sharedApplication")]) {
        applicationClass = cls;
      }
    }
  });

  if (applicationClass) {
    app = (id<GTMUIApplicationProtocol>)[applicationClass sharedApplication];
  }
  return app;
}
#endif //  GTM_BACKGROUND_TASK_FETCHING

#pragma mark NSURLSession Delegate Methods

// NSURLSession documentation indicates that redirectRequest can be passed to the handler
// but empirically redirectRequest lacks the HTTP body, so passing it will break POSTs.
// Instead, we construct a new request, a copy of the original, with overrides from the
// redirect.

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
willPerformHTTPRedirection:(NSHTTPURLResponse *)redirectResponse
        newRequest:(NSURLRequest *)redirectRequest
 completionHandler:(void (^)(NSURLRequest * GTM_NULLABLE_TYPE))handler {
  [self setSessionTask:task];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ task:%@ willPerformHTTPRedirection:%@ newRequest:%@",
                           [self class], self, session, task, redirectResponse, redirectRequest);

  if ([self userStoppedFetching]) {
    handler(nil);
    return;
  }
  if (redirectRequest && redirectResponse) {
    // Copy the original request, including the body.
    NSURLRequest *originalRequest = self.request;
    NSMutableURLRequest *newRequest = [originalRequest mutableCopy];

    // The new requests's URL overrides the original's URL.
    [newRequest setURL:[GTMSessionFetcher redirectURLWithOriginalRequestURL:originalRequest.URL
                                                         redirectRequestURL:redirectRequest.URL]];

    // Any headers in the redirect override headers in the original.
    NSDictionary *redirectHeaders = redirectRequest.allHTTPHeaderFields;
    for (NSString *key in redirectHeaders) {
      NSString *value = [redirectHeaders objectForKey:key];
      [newRequest setValue:value forHTTPHeaderField:key];
    }

    redirectRequest = newRequest;

      // Log the response we just received
    [self setResponse:redirectResponse];
    [self logNowWithError:nil];

    GTMSessionFetcherWillRedirectBlock willRedirectBlock = self.willRedirectBlock;
    if (willRedirectBlock) {
      @synchronized(self) {
        GTMSessionMonitorSynchronized(self);
        [self invokeOnCallbackQueueAfterUserStopped:YES
                                              block:^{
            willRedirectBlock(redirectResponse, redirectRequest, ^(NSURLRequest *clientRequest) {

                // Update the request for future logging.
                [self updateMutableRequest:[clientRequest mutableCopy]];

                handler(clientRequest);
            });
        }];
      }  // @synchronized(self)
      return;
    }
    // Continues here if the client did not provide a redirect block.

    // Update the request for future logging.
    [self updateMutableRequest:[redirectRequest mutableCopy]];
  }
  handler(redirectRequest);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))handler {
  [self setSessionTask:dataTask];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ dataTask:%@ didReceiveResponse:%@",
                           [self class], self, session, dataTask, response);
  void (^accumulateAndFinish)(NSURLSessionResponseDisposition) =
      ^(NSURLSessionResponseDisposition dispositionValue) {
      // This method is called when the server has determined that it
      // has enough information to create the NSURLResponse
      // it can be called multiple times, for example in the case of a
      // redirect, so each time we reset the data.
      @synchronized(self) {
        GTMSessionMonitorSynchronized(self);

        BOOL hadPreviousData = self->_downloadedLength > 0;

        [self->_downloadedData setLength:0];
        self->_downloadedLength = 0;

        if (hadPreviousData && (dispositionValue != NSURLSessionResponseCancel)) {
          // Tell the accumulate block to discard prior data.
          GTMSessionFetcherAccumulateDataBlock accumulateBlock = self->_accumulateDataBlock;
          if (accumulateBlock) {
            [self invokeOnCallbackQueueUnlessStopped:^{
                accumulateBlock(nil);
            }];
          }
        }
      }  // @synchronized(self)
      handler(dispositionValue);
  };

  GTMSessionFetcherDidReceiveResponseBlock receivedResponseBlock;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    receivedResponseBlock = _didReceiveResponseBlock;
    if (receivedResponseBlock) {
      // We will ultimately need to call back to NSURLSession's handler with the disposition value
      // for this delegate method even if the user has stopped the fetcher.
      [self invokeOnCallbackQueueAfterUserStopped:YES
                                            block:^{
        receivedResponseBlock(response, ^(NSURLSessionResponseDisposition desiredDisposition) {
          accumulateAndFinish(desiredDisposition);
        });
      }];
    }
  }  // @synchronized(self)

  if (receivedResponseBlock == nil) {
    accumulateAndFinish(NSURLSessionResponseAllow);
  }
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didBecomeDownloadTask:(NSURLSessionDownloadTask *)downloadTask {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ dataTask:%@ didBecomeDownloadTask:%@",
                           [self class], self, session, dataTask, downloadTask);
  [self setSessionTask:downloadTask];
}


- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
 completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition,
                             NSURLCredential * GTM_NULLABLE_TYPE credential))handler {
  [self setSessionTask:task];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ task:%@ didReceiveChallenge:%@",
                           [self class], self, session, task, challenge);

  GTMSessionFetcherChallengeBlock challengeBlock = self.challengeBlock;
  if (challengeBlock) {
    // The fetcher user has provided custom challenge handling.
    //
    // We will ultimately need to call back to NSURLSession's handler with the disposition value
    // for this delegate method even if the user has stopped the fetcher.
    @synchronized(self) {
      GTMSessionMonitorSynchronized(self);

      [self invokeOnCallbackQueueAfterUserStopped:YES
                                            block:^{
        challengeBlock(self, challenge, handler);
      }];
    }
  } else {
    // No challenge block was provided by the client.
    [self respondToChallenge:challenge
           completionHandler:handler];
  }
}

- (void)respondToChallenge:(NSURLAuthenticationChallenge *)challenge
         completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition,
                                     NSURLCredential * GTM_NULLABLE_TYPE credential))handler {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSInteger previousFailureCount = [challenge previousFailureCount];
    if (previousFailureCount <= 2) {
      NSURLProtectionSpace *protectionSpace = [challenge protectionSpace];
      NSString *authenticationMethod = [protectionSpace authenticationMethod];
      if ([authenticationMethod isEqual:NSURLAuthenticationMethodServerTrust]) {
        // SSL.
        //
        // Background sessions seem to require an explicit check of the server trust object
        // rather than default handling.
        SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
        if (serverTrust == NULL) {
          // No server trust information is available.
          handler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
        } else {
          // Server trust information is available.
          void (^callback)(SecTrustRef, BOOL) = ^(SecTrustRef trustRef, BOOL allow){
            if (allow) {
              NSURLCredential *trustCredential = [NSURLCredential credentialForTrust:trustRef];
              handler(NSURLSessionAuthChallengeUseCredential, trustCredential);
            } else {
              GTMSESSION_LOG_DEBUG(@"Cancelling authentication challenge for %@", self->_request.URL);
              handler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
            }
          };
          if (_allowInvalidServerCertificates) {
            callback(serverTrust, YES);
          } else {
            [[self class] evaluateServerTrust:serverTrust
                                   forRequest:_request
                            completionHandler:callback];
          }
        }
        return;
      }

      NSURLCredential *credential = _credential;

      if ([[challenge protectionSpace] isProxy] && _proxyCredential != nil) {
        credential = _proxyCredential;
      }

      if (credential) {
        handler(NSURLSessionAuthChallengeUseCredential, credential);
      } else {
        // The credential is still nil; tell the OS to use the default handling. This is needed
        // for things that can come out of the keychain (proxies, client certificates, etc.).
        //
        // Note: Looking up a credential with NSURLCredentialStorage's
        // defaultCredentialForProtectionSpace: is *not* the same invoking the handler with
        // NSURLSessionAuthChallengePerformDefaultHandling. In the case of
        // NSURLAuthenticationMethodClientCertificate, you can get nil back from
        // NSURLCredentialStorage, while using this code path instead works.
        handler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      }

    } else {
      // We've failed auth 3 times.  The completion handler will be called with code
      // NSURLErrorCancelled.
      handler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
    }
  }  // @synchronized(self)
}

// Return redirect URL based on the original request URL and redirect request URL.
//
// Method disallows any scheme changes between the original request URL and redirect request URL
// aside from "http" to "https". If a change in scheme is detected the redirect URL inherits the
// scheme from the original request URL.
+ (GTM_NULLABLE NSURL *)redirectURLWithOriginalRequestURL:(GTM_NULLABLE NSURL *)originalRequestURL
                                       redirectRequestURL:(GTM_NULLABLE NSURL *)redirectRequestURL {
  // In the case of an NSURLSession redirect, neither URL should ever be nil; as a sanity check
  // if either is nil return the other URL.
  if (!redirectRequestURL) return originalRequestURL;
  if (!originalRequestURL) return redirectRequestURL;

  NSString *originalScheme = originalRequestURL.scheme;
  NSString *redirectScheme = redirectRequestURL.scheme;
  BOOL insecureToSecureRedirect =
      (originalScheme != nil && [originalScheme caseInsensitiveCompare:@"http"] == NSOrderedSame &&
       redirectScheme != nil && [redirectScheme caseInsensitiveCompare:@"https"] == NSOrderedSame);

  // This can't really be nil for the inputs, but to keep the analyzer happy
  // for the -caseInsensitiveCompare: call below, give it a value if it were.
  if (!originalScheme) originalScheme = @"https";

  // Check for changes to the scheme and disallow any changes except for http to https.
  if (!insecureToSecureRedirect &&
      (redirectScheme.length != originalScheme.length ||
       [redirectScheme caseInsensitiveCompare:originalScheme] != NSOrderedSame)) {
    NSURLComponents *components =
        [NSURLComponents componentsWithURL:(NSURL * _Nonnull)redirectRequestURL
                   resolvingAgainstBaseURL:NO];
    components.scheme = originalScheme;
    return components.URL;
  }

  return redirectRequestURL;
}

// Validate the certificate chain.
//
// This may become a public method if it appears to be useful to users.
+ (void)evaluateServerTrust:(SecTrustRef)serverTrust
                 forRequest:(NSURLRequest *)request
          completionHandler:(void (^)(SecTrustRef trustRef, BOOL allow))handler {
  // Retain the trust object to avoid a SecTrustEvaluate() crash on iOS 7.
  CFRetain(serverTrust);

  // Evaluate the certificate chain.
  //
  // The delegate queue may be the main thread. Trust evaluation could cause some
  // blocking network activity, so we must evaluate async, as documented at
  // https://developer.apple.com/library/ios/technotes/tn2232/
  //
  // We must also avoid multiple uses of the trust object, per docs:
  // "It is not safe to call this function concurrently with any other function that uses
  // the same trust management object, or to re-enter this function for the same trust
  // management object."
  //
  // SecTrustEvaluateAsync both does sync execution of Evaluate and calls back on the
  // queue passed to it, according to at sources in
  // http://www.opensource.apple.com/source/libsecurity_keychain/libsecurity_keychain-55050.9/lib/SecTrust.cpp
  // It would require a global serial queue to ensure the evaluate happens only on a
  // single thread at a time, so we'll stick with using SecTrustEvaluate on a background
  // thread.
  dispatch_queue_t evaluateBackgroundQueue =
    dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
  dispatch_async(evaluateBackgroundQueue, ^{
    // It looks like the implementation of SecTrustEvaluate() on Mac grabs a global lock,
    // so it may be redundant for us to also lock, but it's easy to synchronize here
    // anyway.
    SecTrustResultType trustEval = kSecTrustResultInvalid;
    BOOL shouldAllow;
    OSStatus trustError;
    @synchronized([GTMSessionFetcher class]) {
      GTMSessionMonitorSynchronized([GTMSessionFetcher class]);

      trustError = SecTrustEvaluate(serverTrust, &trustEval);
    }
    if (trustError != errSecSuccess) {
      GTMSESSION_LOG_DEBUG(@"Error %d evaluating trust for %@",
                           (int)trustError, request);
      shouldAllow = NO;
    } else {
      // Having a trust level "unspecified" by the user is the usual result, described at
      //   https://developer.apple.com/library/mac/qa/qa1360
      if (trustEval == kSecTrustResultUnspecified
          || trustEval == kSecTrustResultProceed) {
        shouldAllow = YES;
      } else {
        shouldAllow = NO;
        GTMSESSION_LOG_DEBUG(@"Challenge SecTrustResultType %u for %@, properties: %@",
                             trustEval, request.URL.host,
                             CFBridgingRelease(SecTrustCopyProperties(serverTrust)));
      }
    }
    handler(serverTrust, shouldAllow);

    CFRelease(serverTrust);
  });
}

- (void)invokeOnCallbackQueueUnlessStopped:(void (^)(void))block {
  [self invokeOnCallbackQueueAfterUserStopped:NO
                                        block:block];
}

- (void)invokeOnCallbackQueueAfterUserStopped:(BOOL)afterStopped
                                        block:(void (^)(void))block {
  GTMSessionCheckSynchronized(self);

  [self invokeOnCallbackUnsynchronizedQueueAfterUserStopped:afterStopped
                                                      block:block];
}

- (void)invokeOnCallbackUnsynchronizedQueueAfterUserStopped:(BOOL)afterStopped
                                                      block:(void (^)(void))block {
  // testBlock simulation code may not be synchronizing when this is invoked.
  [self invokeOnCallbackQueue:_callbackQueue
             afterUserStopped:afterStopped
                        block:block];
}

- (void)invokeOnCallbackQueue:(dispatch_queue_t)callbackQueue
             afterUserStopped:(BOOL)afterStopped
                        block:(void (^)(void))block {
  if (callbackQueue) {
    dispatch_group_async(_callbackGroup, callbackQueue, ^{
        if (!afterStopped) {
          NSDate *serviceStoppedAllDate = [self->_service stoppedAllFetchersDate];

          @synchronized(self) {
            GTMSessionMonitorSynchronized(self);

            // Avoid a race between stopFetching and the callback.
            if (self->_userStoppedFetching) {
              return;
            }

            // Also avoid calling back if the service has stopped all fetchers
            // since this one was created. The fetcher may have stopped before
            // stopAllFetchers was invoked, so _userStoppedFetching wasn't set,
            // but the app still won't expect the callback to fire after
            // the service's stopAllFetchers was invoked.
            if (serviceStoppedAllDate
                && [self->_initialBeginFetchDate compare:serviceStoppedAllDate] != NSOrderedDescending) {
              // stopAllFetchers was called after this fetcher began.
              return;
            }
          }  // @synchronized(self)
        }
        block();
    });
  }
}

- (void)invokeFetchCallbacksOnCallbackQueueWithData:(GTM_NULLABLE NSData *)data
                                              error:(GTM_NULLABLE NSError *)error {
  // Callbacks will be released in the method stopFetchReleasingCallbacks:
  GTMSessionFetcherCompletionHandler handler;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    handler = _completionHandler;

    if (handler) {
      [self invokeOnCallbackQueueUnlessStopped:^{
        handler(data, error);

        // Post a notification, primarily to allow code to collect responses for
        // testing.
        //
        // The observing code is not likely on the fetcher's callback
        // queue, so this posts explicitly to the main queue.
        NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
        if (data) {
          userInfo[kGTMSessionFetcherCompletionDataKey] = data;
        }
        if (error) {
          userInfo[kGTMSessionFetcherCompletionErrorKey] = error;
        }
        [self postNotificationOnMainThreadWithName:kGTMSessionFetcherCompletionInvokedNotification
                                          userInfo:userInfo
                                      requireAsync:NO];
      }];
    }
  }  // @synchronized(self)
}

- (void)postNotificationOnMainThreadWithName:(NSString *)noteName
                                    userInfo:(GTM_NULLABLE NSDictionary *)userInfo
                                requireAsync:(BOOL)requireAsync {
  dispatch_block_t postBlock = ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:noteName
                                                        object:self
                                                      userInfo:userInfo];
  };

  if ([NSThread isMainThread] && !requireAsync) {
    // Post synchronously for compatibility with older code using the fetcher.

    // Avoid calling out to other code from inside a sync block to avoid risk
    // of a deadlock or of recursive sync.
    GTMSessionCheckNotSynchronized(self);

    postBlock();
  } else {
    dispatch_async(dispatch_get_main_queue(), postBlock);
  }
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)uploadTask
 needNewBodyStream:(void (^)(NSInputStream * GTM_NULLABLE_TYPE bodyStream))completionHandler {
  [self setSessionTask:uploadTask];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ task:%@ needNewBodyStream:",
                           [self class], self, session, uploadTask);
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSessionFetcherBodyStreamProvider provider = _bodyStreamProvider;
#if !STRIP_GTM_FETCH_LOGGING
    if ([self respondsToSelector:@selector(loggedStreamProviderForStreamProvider:)]) {
      provider = [self performSelector:@selector(loggedStreamProviderForStreamProvider:)
                            withObject:provider];
    }
#endif
    if (provider) {
      [self invokeOnCallbackQueueUnlessStopped:^{
          provider(completionHandler);
      }];
    } else {
      GTMSESSION_ASSERT_DEBUG(NO, @"NSURLSession expects a stream provider");

      completionHandler(nil);
    }
  }  // @synchronized(self)
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend {
  [self setSessionTask:task];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ task:%@ didSendBodyData:%lld"
                           @" totalBytesSent:%lld totalBytesExpectedToSend:%lld",
                           [self class], self, session, task, bytesSent, totalBytesSent,
                           totalBytesExpectedToSend);
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (!_sendProgressBlock) {
      return;
    }
    // We won't hold on to send progress block; it's ok to not send it if the upload finishes.
    [self invokeOnCallbackQueueUnlessStopped:^{
      GTMSessionFetcherSendProgressBlock progressBlock;
      @synchronized(self) {
        GTMSessionMonitorSynchronized(self);

        progressBlock = self->_sendProgressBlock;
      }
      if (progressBlock) {
        progressBlock(bytesSent, totalBytesSent, totalBytesExpectedToSend);
      }
    }];
  }  // @synchronized(self)
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data {
  [self setSessionTask:dataTask];
  NSUInteger bufferLength = data.length;
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ dataTask:%@ didReceiveData:%p (%llu bytes)",
                           [self class], self, session, dataTask, data,
                           (unsigned long long)bufferLength);
  if (bufferLength == 0) {
    // Observed on completing an out-of-process upload.
    return;
  }
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSessionFetcherAccumulateDataBlock accumulateBlock = _accumulateDataBlock;
    if (accumulateBlock) {
      // Let the client accumulate the data.
      _downloadedLength += bufferLength;
      [self invokeOnCallbackQueueUnlessStopped:^{
          accumulateBlock(data);
      }];
    } else if (!_userStoppedFetching) {
      // Append to the mutable data buffer unless the fetch has been cancelled.

      // Resumed upload tasks may not yet have a data buffer.
      if (_downloadedData == nil) {
        // Using NSClassFromString for iOS 6 compatibility.
        GTMSESSION_ASSERT_DEBUG(
            ![dataTask isKindOfClass:NSClassFromString(@"NSURLSessionDownloadTask")],
            @"Resumed download tasks should not receive data bytes");
        _downloadedData = [[NSMutableData alloc] init];
      }

      [_downloadedData appendData:data];
      _downloadedLength = (int64_t)_downloadedData.length;

      // We won't hold on to receivedProgressBlock here; it's ok to not send
      // it if the transfer finishes.
      if (_receivedProgressBlock) {
        [self invokeOnCallbackQueueUnlessStopped:^{
            GTMSessionFetcherReceivedProgressBlock progressBlock;
            @synchronized(self) {
              GTMSessionMonitorSynchronized(self);

              progressBlock = self->_receivedProgressBlock;
            }
            if (progressBlock) {
              progressBlock((int64_t)bufferLength, self->_downloadedLength);
            }
        }];
      }
    }
  }  // @synchronized(self)
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
 willCacheResponse:(NSCachedURLResponse *)proposedResponse
 completionHandler:(void (^)(NSCachedURLResponse *cachedResponse))completionHandler {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ dataTask:%@ willCacheResponse:%@ %@",
                           [self class], self, session, dataTask,
                           proposedResponse, proposedResponse.response);
  GTMSessionFetcherWillCacheURLResponseBlock callback;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    callback = _willCacheURLResponseBlock;

    if (callback) {
      [self invokeOnCallbackQueueAfterUserStopped:YES
                                            block:^{
          callback(proposedResponse, completionHandler);
      }];
    }
  }  // @synchronized(self)
  if (!callback) {
    completionHandler(proposedResponse);
  }
}


- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
      didWriteData:(int64_t)bytesWritten
 totalBytesWritten:(int64_t)totalBytesWritten
totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ downloadTask:%@ didWriteData:%lld"
                           @" bytesWritten:%lld totalBytesExpectedToWrite:%lld",
                           [self class], self, session, downloadTask, bytesWritten,
                           totalBytesWritten, totalBytesExpectedToWrite);
  [self setSessionTask:downloadTask];
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if ((totalBytesExpectedToWrite != NSURLSessionTransferSizeUnknown) &&
        (totalBytesExpectedToWrite < totalBytesWritten)) {
      // Have observed cases were bytesWritten == totalBytesExpectedToWrite,
      // but totalBytesWritten > totalBytesExpectedToWrite, so setting to unkown in these cases.
      totalBytesExpectedToWrite = NSURLSessionTransferSizeUnknown;
    }
    // We won't hold on to download progress block during the enqueue;
    // it's ok to not send it if the upload finishes.

    [self invokeOnCallbackQueueUnlessStopped:^{
      GTMSessionFetcherDownloadProgressBlock progressBlock;
      @synchronized(self) {
        GTMSessionMonitorSynchronized(self);

        progressBlock = self->_downloadProgressBlock;
      }
      if (progressBlock) {
        progressBlock(bytesWritten, totalBytesWritten, totalBytesExpectedToWrite);
      }
    }];
  }  // @synchronized(self)
}

- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
 didResumeAtOffset:(int64_t)fileOffset
expectedTotalBytes:(int64_t)expectedTotalBytes {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ downloadTask:%@ didResumeAtOffset:%lld"
                           @" expectedTotalBytes:%lld",
                           [self class], self, session, downloadTask, fileOffset,
                           expectedTotalBytes);
  [self setSessionTask:downloadTask];
}

- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
didFinishDownloadingToURL:(NSURL *)downloadLocationURL {
  // Download may have relaunched app, so update _sessionTask.
  [self setSessionTask:downloadTask];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ downloadTask:%@ didFinishDownloadingToURL:%@",
                           [self class], self, session, downloadTask, downloadLocationURL);
  NSNumber *fileSizeNum;
  [downloadLocationURL getResourceValue:&fileSizeNum
                                 forKey:NSURLFileSizeKey
                                  error:NULL];
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSURL *destinationURL = _destinationFileURL;

    _downloadedLength = fileSizeNum.longLongValue;

    // Overwrite any previous file at the destination URL.
    NSFileManager *fileMgr = [NSFileManager defaultManager];
    NSError *removeError;
    if (![fileMgr removeItemAtURL:destinationURL error:&removeError]
        && removeError.code != NSFileNoSuchFileError) {
      GTMSESSION_LOG_DEBUG(@"Could not remove previous file at %@ due to %@",
                           downloadLocationURL.path, removeError);
    }

    NSInteger statusCode = [self statusCodeUnsynchronized];
    if (statusCode < 200 || statusCode > 399) {
      // In OS X 10.11, the response body is written to a file even on a server
      // status error.  For convenience of the fetcher client, we'll skip saving the
      // downloaded body to the destination URL so that clients do not need to know
      // to delete the file following fetch errors.
      GTMSESSION_LOG_DEBUG(@"Abandoning download due to status %ld, file %@",
                           (long)statusCode, downloadLocationURL.path);

      // On error code, add the contents of the temporary file to _downloadTaskErrorData
      // This way fetcher clients have access to error details possibly passed by the server.
      if (_downloadedLength > 0 && _downloadedLength <= kMaximumDownloadErrorDataLength) {
        _downloadTaskErrorData = [NSData dataWithContentsOfURL:downloadLocationURL];
      } else if (_downloadedLength > kMaximumDownloadErrorDataLength) {
        GTMSESSION_LOG_DEBUG(@"Download error data for file %@ not passed to userInfo due to size "
                             @"%lld", downloadLocationURL.path, _downloadedLength);
      }
    } else {
      NSError *moveError;
      NSURL *destinationFolderURL = [destinationURL URLByDeletingLastPathComponent];
      BOOL didMoveDownload = NO;
      if ([fileMgr createDirectoryAtURL:destinationFolderURL
            withIntermediateDirectories:YES
                             attributes:nil
                                  error:&moveError]) {
        didMoveDownload = [fileMgr moveItemAtURL:downloadLocationURL
                                           toURL:destinationURL
                                           error:&moveError];
      }
      if (!didMoveDownload) {
        _downloadFinishedError = moveError;
      }
      GTM_LOG_BACKGROUND_SESSION(@"%@ %p Moved download from \"%@\" to \"%@\"  %@",
                                 [self class], self,
                                 downloadLocationURL.path, destinationURL.path,
                                 error ? error : @"");
    }
  }  // @synchronized(self)
}

/* Sent as the last message related to a specific task.  Error may be
 * nil, which implies that no error occurred and this task is complete.
 */
- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error {
  [self setSessionTask:task];
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ task:%@ didCompleteWithError:%@",
                           [self class], self, session, task, error);

  NSInteger status = self.statusCode;
  BOOL forceAssumeRetry = NO;
  BOOL succeeded = NO;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

#if !GTM_DISABLE_FETCHER_TEST_BLOCK
    // The task is never resumed when a testBlock is used. When the session is destroyed,
    // we should ignore the callback, since the testBlock support code itself invokes
    // shouldRetryNowForStatus: and finishWithError:shouldRetry:
    if (_isUsingTestBlock) return;
#endif

    if (error == nil) {
      error = _downloadFinishedError;
    }
    succeeded = (error == nil && status >= 0 && status < 300);
    if (succeeded) {
      // Succeeded.
      _bodyLength = task.countOfBytesSent;
    }
  }  // @synchronized(self)

  if (succeeded) {
    [self finishWithError:nil shouldRetry:NO];
    return;
  }
  // For background redirects, no delegate method is called, so we cannot restore a stripped
  // Authorization header, so if a 403 ("Forbidden") was generated due to a missing OAuth 2 header,
  // set the current request's URL to the redirected URL, so we in effect restore the Authorization
  // header.
  if ((status == 403) && self.usingBackgroundSession) {
    NSURL *redirectURL = self.response.URL;
    NSURLRequest *request = self.request;
    if (![request.URL isEqual:redirectURL]) {
      NSString *authorizationHeader = [request.allHTTPHeaderFields objectForKey:@"Authorization"];
      if (authorizationHeader != nil) {
        NSMutableURLRequest *mutableRequest = [request mutableCopy];
        mutableRequest.URL = redirectURL;
        [self updateMutableRequest:mutableRequest];
        // Avoid assuming the session is still valid.
        self.session = nil;
        forceAssumeRetry = YES;
      }
    }
  }

  // If invalidating the session was deferred in stopFetchReleasingCallbacks: then do it now.
  NSURLSession *oldSession = self.sessionNeedingInvalidation;
  if (oldSession) {
    [self setSessionNeedingInvalidation:NULL];
    [oldSession finishTasksAndInvalidate];
  }

  // Failed.
  [self shouldRetryNowForStatus:status
                          error:error
               forceAssumeRetry:forceAssumeRetry
                       response:^(BOOL shouldRetry) {
    [self finishWithError:error shouldRetry:shouldRetry];
  }];
}

#if TARGET_OS_IPHONE
- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSessionDidFinishEventsForBackgroundURLSession:%@",
                           [self class], self, session);
  [self removePersistedBackgroundSessionFromDefaults];

  GTMSessionFetcherSystemCompletionHandler handler;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    handler = self.systemCompletionHandler;
    self.systemCompletionHandler = nil;
  }  // @synchronized(self)
  if (handler) {
    GTM_LOG_BACKGROUND_SESSION(@"%@ %p Calling system completionHandler", [self class], self);
    handler();

    @synchronized(self) {
      GTMSessionMonitorSynchronized(self);

      NSURLSession *oldSession = _session;
      _session = nil;
      if (_shouldInvalidateSession) {
        [oldSession finishTasksAndInvalidate];
      }
    }  // @synchronized(self)
  }
}
#endif

- (void)URLSession:(NSURLSession *)session didBecomeInvalidWithError:(GTM_NULLABLE NSError *)error {
  // This may happen repeatedly for retries.  On authentication callbacks, the retry
  // may begin before the prior session sends the didBecomeInvalid delegate message.
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ didBecomeInvalidWithError:%@",
                           [self class], self, session, error);
  if (session == (NSURLSession *)self.session) {
    GTM_LOG_SESSION_DELEGATE(@"  Unexpected retained invalid session: %@", session);
    self.session = nil;
  }
}

- (void)finishWithError:(GTM_NULLABLE NSError *)error shouldRetry:(BOOL)shouldRetry {
  [self removePersistedBackgroundSessionFromDefaults];

  BOOL shouldStopFetching = YES;
  NSData *downloadedData = nil;
#if !STRIP_GTM_FETCH_LOGGING
  BOOL shouldDeferLogging = NO;
#endif
  BOOL shouldBeginRetryTimer = NO;
  NSInteger status = [self statusCode];
  NSURL *destinationURL = self.destinationFileURL;

  BOOL fetchSucceeded = (error == nil && status >= 0 && status < 300);

#if !STRIP_GTM_FETCH_LOGGING
  if (!fetchSucceeded) {
    if (!shouldDeferLogging && !self.hasLoggedError) {
      [self logNowWithError:error];
      self.hasLoggedError = YES;
    }
  }
#endif  // !STRIP_GTM_FETCH_LOGGING

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

#if !STRIP_GTM_FETCH_LOGGING
    shouldDeferLogging = _deferResponseBodyLogging;
#endif
    if (fetchSucceeded) {
      // Success
      if ((_downloadedData.length > 0) && (destinationURL != nil)) {
        // Overwrite any previous file at the destination URL.
        NSFileManager *fileMgr = [NSFileManager defaultManager];
        [fileMgr removeItemAtURL:destinationURL
                           error:NULL];
        NSURL *destinationFolderURL = [destinationURL URLByDeletingLastPathComponent];
        BOOL didMoveDownload = NO;
        if ([fileMgr createDirectoryAtURL:destinationFolderURL
              withIntermediateDirectories:YES
                               attributes:nil
                                    error:&error]) {
          didMoveDownload = [_downloadedData writeToURL:destinationURL
                                                options:NSDataWritingAtomic
                                                  error:&error];
        }
        if (didMoveDownload) {
          _downloadedData = nil;
        } else {
          _downloadFinishedError = error;
        }
      }
      downloadedData = _downloadedData;
    } else {
      // Unsuccessful with error or status over 300. Retry or notify the delegate of failure
      if (shouldRetry) {
        // Retrying.
        shouldBeginRetryTimer = YES;
        shouldStopFetching = NO;
      } else {
        if (error == nil) {
          // Create an error.
          NSDictionary *userInfo = GTMErrorUserInfoForData(
              _downloadedData.length > 0 ? _downloadedData : _downloadTaskErrorData,
              [self responseHeadersUnsynchronized]);

          error = [NSError errorWithDomain:kGTMSessionFetcherStatusDomain
                                      code:status
                                  userInfo:userInfo];
        } else {
          // If the error had resume data, and the client supplied a resume block, pass the
          // data to the client.
          void (^resumeBlock)(NSData *) = _resumeDataBlock;
          _resumeDataBlock = nil;
          if (resumeBlock) {
            NSData *resumeData = [error.userInfo objectForKey:NSURLSessionDownloadTaskResumeData];
            if (resumeData) {
              [self invokeOnCallbackQueueAfterUserStopped:YES block:^{
                  resumeBlock(resumeData);
              }];
            }
          }
        }
        if (_downloadedData.length > 0) {
          downloadedData = _downloadedData;
        }
        // If the error occurred after retries, report the number and duration of the
        // retries. This provides a clue to a developer looking at the error description
        // that the fetcher did retry before failing with this error.
        if (_retryCount > 0) {
          NSMutableDictionary *userInfoWithRetries =
              [NSMutableDictionary dictionaryWithDictionary:(NSDictionary *)error.userInfo];
          NSTimeInterval timeSinceInitialRequest = -[_initialRequestDate timeIntervalSinceNow];
          [userInfoWithRetries setObject:@(timeSinceInitialRequest)
                                  forKey:kGTMSessionFetcherElapsedIntervalWithRetriesKey];
          [userInfoWithRetries setObject:@(_retryCount)
                                  forKey:kGTMSessionFetcherNumberOfRetriesDoneKey];
          error = [NSError errorWithDomain:(NSString *)error.domain
                                      code:error.code
                                  userInfo:userInfoWithRetries];
        }
      }
    }
  }  // @synchronized(self)

  if (shouldBeginRetryTimer) {
    [self beginRetryTimer];
  }

  // We want to send the stop notification before calling the delegate's
  // callback selector, since the callback selector may release all of
  // the fetcher properties that the client is using to track the fetches.
  //
  // We'll also stop now so that, to any observers watching the notifications,
  // it doesn't look like our wait for a retry (which may be long,
  // 30 seconds or more) is part of the network activity.
  [self sendStopNotificationIfNeeded];

  if (shouldStopFetching) {
    [self invokeFetchCallbacksOnCallbackQueueWithData:downloadedData
                                                error:error];
    // The upload subclass doesn't want to release callbacks until upload chunks have completed.
    BOOL shouldRelease = [self shouldReleaseCallbacksUponCompletion];
    [self stopFetchReleasingCallbacks:shouldRelease];
  }

#if !STRIP_GTM_FETCH_LOGGING
  // _hasLoggedError is only set by this method
  if (!shouldDeferLogging && !_hasLoggedError) {
    [self logNowWithError:error];
  }
#endif
}

- (BOOL)shouldReleaseCallbacksUponCompletion {
  // A subclass can override this to keep callbacks around after the
  // connection has finished successfully
  return YES;
}

- (void)logNowWithError:(GTM_NULLABLE NSError *)error {
  GTMSessionCheckNotSynchronized(self);

  // If the logging category is available, then log the current request,
  // response, data, and error
  if ([self respondsToSelector:@selector(logFetchWithError:)]) {
    [self performSelector:@selector(logFetchWithError:) withObject:error];
  }
}

#pragma mark Retries

- (BOOL)isRetryError:(NSError *)error {
  struct RetryRecord {
    __unsafe_unretained NSString *const domain;
    NSInteger code;
  };

  struct RetryRecord retries[] = {
    { kGTMSessionFetcherStatusDomain, 408 }, // request timeout
    { kGTMSessionFetcherStatusDomain, 502 }, // failure gatewaying to another server
    { kGTMSessionFetcherStatusDomain, 503 }, // service unavailable
    { kGTMSessionFetcherStatusDomain, 504 }, // request timeout
    { NSURLErrorDomain, NSURLErrorTimedOut },
    { NSURLErrorDomain, NSURLErrorNetworkConnectionLost },
    { nil, 0 }
  };

  // NSError's isEqual always returns false for equal but distinct instances
  // of NSError, so we have to compare the domain and code values explicitly
  NSString *domain = error.domain;
  NSInteger code = error.code;
  for (int idx = 0; retries[idx].domain != nil; idx++) {
    if (code == retries[idx].code && [domain isEqual:retries[idx].domain]) {
      return YES;
    }
  }
  return NO;
}

// shouldRetryNowForStatus:error: responds with YES if the user has enabled retries
// and the status or error is one that is suitable for retrying.  "Suitable"
// means either the isRetryError:'s list contains the status or error, or the
// user's retry block is present and returns YES when called, or the
// authorizer may be able to fix.
- (void)shouldRetryNowForStatus:(NSInteger)status
                          error:(NSError *)error
               forceAssumeRetry:(BOOL)forceAssumeRetry
                       response:(GTMSessionFetcherRetryResponse)response {
  // Determine if a refreshed authorizer may avoid an authorization error
  BOOL willRetry = NO;

  // We assume _authorizer is immutable after beginFetch, and _hasAttemptedAuthRefresh is modified
  // only in this method, and this method is invoked on the serial delegate queue.
  //
  // We want to avoid calling the authorizer from inside a sync block.
  BOOL isFirstAuthError = (_authorizer != nil
                           && !_hasAttemptedAuthRefresh
                           && status == GTMSessionFetcherStatusUnauthorized); // 401

  BOOL hasPrimed = NO;
  if (isFirstAuthError) {
    if ([_authorizer respondsToSelector:@selector(primeForRefresh)]) {
      hasPrimed = [_authorizer primeForRefresh];
    }
  }

  BOOL shouldRetryForAuthRefresh = NO;
  if (hasPrimed) {
    shouldRetryForAuthRefresh = YES;
    _hasAttemptedAuthRefresh = YES;
    [self updateRequestValue:nil forHTTPHeaderField:@"Authorization"];
  }

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    BOOL shouldDoRetry = [self isRetryEnabledUnsynchronized];
    if (shouldDoRetry && ![self hasRetryAfterInterval]) {

      // Determine if we're doing exponential backoff retries
      shouldDoRetry = [self nextRetryIntervalUnsynchronized] < _maxRetryInterval;

      if (shouldDoRetry) {
        // If an explicit max retry interval was set, we expect repeated backoffs to take
        // up to roughly twice that for repeated fast failures.  If the initial attempt is
        // already more than 3 times the max retry interval, then failures have taken a long time
        // (such as from network timeouts) so don't retry again to avoid the app becoming
        // unexpectedly unresponsive.
        if (_maxRetryInterval > 0) {
          NSTimeInterval maxAllowedIntervalBeforeRetry = _maxRetryInterval * 3;
          NSTimeInterval timeSinceInitialRequest = -[_initialRequestDate timeIntervalSinceNow];
          if (timeSinceInitialRequest > maxAllowedIntervalBeforeRetry) {
            shouldDoRetry = NO;
          }
        }
      }
    }
    BOOL canRetry = shouldRetryForAuthRefresh || forceAssumeRetry || shouldDoRetry;
    if (canRetry) {
      NSDictionary *userInfo =
          GTMErrorUserInfoForData(_downloadedData, [self responseHeadersUnsynchronized]);
      NSError *statusError = [NSError errorWithDomain:kGTMSessionFetcherStatusDomain
                                                 code:status
                                             userInfo:userInfo];
      if (error == nil) {
        error = statusError;
      }
      willRetry = shouldRetryForAuthRefresh ||
                  forceAssumeRetry ||
                  [self isRetryError:error] ||
                  ((error != statusError) && [self isRetryError:statusError]);

      // If the user has installed a retry callback, consult that.
      GTMSessionFetcherRetryBlock retryBlock = _retryBlock;
      if (retryBlock) {
        [self invokeOnCallbackQueueUnlessStopped:^{
            retryBlock(willRetry, error, response);
        }];
        return;
      }
    }
  }  // @synchronized(self)
  response(willRetry);
}

- (BOOL)hasRetryAfterInterval {
  GTMSessionCheckSynchronized(self);

  NSDictionary *responseHeaders = [self responseHeadersUnsynchronized];
  NSString *retryAfterValue = [responseHeaders valueForKey:@"Retry-After"];
  return (retryAfterValue != nil);
}

- (NSTimeInterval)retryAfterInterval {
  GTMSessionCheckSynchronized(self);

  NSDictionary *responseHeaders = [self responseHeadersUnsynchronized];
  NSString *retryAfterValue = [responseHeaders valueForKey:@"Retry-After"];
  if (retryAfterValue == nil) {
    return 0;
  }
  // Retry-After formatted as HTTP-date | delta-seconds
  // Reference: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
  NSDateFormatter *rfc1123DateFormatter = [[NSDateFormatter alloc] init];
  rfc1123DateFormatter.locale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US"];
  rfc1123DateFormatter.timeZone = [NSTimeZone timeZoneWithAbbreviation:@"GMT"];
  rfc1123DateFormatter.dateFormat = @"EEE',' dd MMM yyyy HH':'mm':'ss z";
  NSDate *retryAfterDate = [rfc1123DateFormatter dateFromString:retryAfterValue];
  NSTimeInterval retryAfterInterval = (retryAfterDate != nil) ?
      retryAfterDate.timeIntervalSinceNow : retryAfterValue.intValue;
  retryAfterInterval = MAX(0, retryAfterInterval);
  return retryAfterInterval;
}

- (void)beginRetryTimer {
  if (![NSThread isMainThread]) {
    // Defer creating and starting the timer until we're on the main thread to ensure it has
    // a run loop.
    dispatch_group_async(_callbackGroup, dispatch_get_main_queue(), ^{
        [self beginRetryTimer];
    });
    return;
  }

  [self destroyRetryTimer];

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSTimeInterval nextInterval = [self nextRetryIntervalUnsynchronized];
    NSTimeInterval maxInterval = _maxRetryInterval;
    NSTimeInterval newInterval = MIN(nextInterval, (maxInterval > 0 ? maxInterval : DBL_MAX));
    NSTimeInterval newIntervalTolerance = (newInterval / 10) > 1.0 ?: 1.0;

    _lastRetryInterval = newInterval;

    _retryTimer = [NSTimer timerWithTimeInterval:newInterval
                                          target:self
                                        selector:@selector(retryTimerFired:)
                                        userInfo:nil
                                         repeats:NO];
    _retryTimer.tolerance = newIntervalTolerance;
    [[NSRunLoop mainRunLoop] addTimer:_retryTimer
                              forMode:NSDefaultRunLoopMode];
  }  // @synchronized(self)

  [self postNotificationOnMainThreadWithName:kGTMSessionFetcherRetryDelayStartedNotification
                                    userInfo:nil
                                requireAsync:NO];
}

- (void)retryTimerFired:(NSTimer *)timer {
  [self destroyRetryTimer];

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _retryCount++;
  }  // @synchronized(self)

  NSOperationQueue *queue = self.sessionDelegateQueue;
  [queue addOperationWithBlock:^{
    [self retryFetch];
  }];
}

- (void)destroyRetryTimer {
  BOOL shouldNotify = NO;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_retryTimer) {
      [_retryTimer invalidate];
      _retryTimer = nil;
      shouldNotify = YES;
    }
  }

  if (shouldNotify) {
    [self postNotificationOnMainThreadWithName:kGTMSessionFetcherRetryDelayStoppedNotification
                                      userInfo:nil
                                  requireAsync:NO];
  }
}

- (NSUInteger)retryCount {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _retryCount;
  }  // @synchronized(self)
}

- (NSTimeInterval)nextRetryInterval {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSTimeInterval interval = [self nextRetryIntervalUnsynchronized];
    return interval;
  }  // @synchronized(self)
}

- (NSTimeInterval)nextRetryIntervalUnsynchronized {
  GTMSessionCheckSynchronized(self);

  NSInteger statusCode = [self statusCodeUnsynchronized];
  if ((statusCode == 503) && [self hasRetryAfterInterval]) {
    NSTimeInterval secs = [self retryAfterInterval];
    return secs;
  }
  // The next wait interval is the factor (2.0) times the last interval,
  // but never less than the minimum interval.
  NSTimeInterval secs = _lastRetryInterval * _retryFactor;
  if (_maxRetryInterval > 0) {
    secs = MIN(secs, _maxRetryInterval);
  }
  secs = MAX(secs, _minRetryInterval);

  return secs;
}

- (NSTimer *)retryTimer {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _retryTimer;
  }  // @synchronized(self)
}

- (BOOL)isRetryEnabled {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _isRetryEnabled;
  }  // @synchronized(self)
}

- (BOOL)isRetryEnabledUnsynchronized {
  GTMSessionCheckSynchronized(self);

  return _isRetryEnabled;
}

- (void)setRetryEnabled:(BOOL)flag {

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (flag && !_isRetryEnabled) {
      // We defer initializing these until the user calls setRetryEnabled
      // to avoid using the random number generator if it's not needed.
      // However, this means min and max intervals for this fetcher are reset
      // as a side effect of calling setRetryEnabled.
      //
      // Make an initial retry interval random between 1.0 and 2.0 seconds
      _minRetryInterval = InitialMinRetryInterval();
      _maxRetryInterval = kUnsetMaxRetryInterval;
      _retryFactor = 2.0;
      _lastRetryInterval = 0.0;
    }
    _isRetryEnabled = flag;
  }  // @synchronized(self)
};

- (NSTimeInterval)maxRetryInterval {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _maxRetryInterval;
  }  // @synchronized(self)
}

- (void)setMaxRetryInterval:(NSTimeInterval)secs {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (secs > 0) {
      _maxRetryInterval = secs;
    } else {
      _maxRetryInterval = kUnsetMaxRetryInterval;
    }
  }  // @synchronized(self)
}

- (double)minRetryInterval {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _minRetryInterval;
  }  // @synchronized(self)
}

- (void)setMinRetryInterval:(NSTimeInterval)secs {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (secs > 0) {
      _minRetryInterval = secs;
    } else {
      // Set min interval to a random value between 1.0 and 2.0 seconds
      // so that if multiple clients start retrying at the same time, they'll
      // repeat at different times and avoid overloading the server
      _minRetryInterval = InitialMinRetryInterval();
    }
  }  // @synchronized(self)

}

#pragma mark iOS System Completion Handlers

#if TARGET_OS_IPHONE
static NSMutableDictionary *gSystemCompletionHandlers = nil;

- (GTM_NULLABLE GTMSessionFetcherSystemCompletionHandler)systemCompletionHandler {
  return [[self class] systemCompletionHandlerForSessionIdentifier:_sessionIdentifier];
}

- (void)setSystemCompletionHandler:(GTM_NULLABLE GTMSessionFetcherSystemCompletionHandler)systemCompletionHandler {
  [[self class] setSystemCompletionHandler:systemCompletionHandler
                      forSessionIdentifier:_sessionIdentifier];
}

+ (void)setSystemCompletionHandler:(GTM_NULLABLE GTMSessionFetcherSystemCompletionHandler)systemCompletionHandler
              forSessionIdentifier:(NSString *)sessionIdentifier {
  if (!sessionIdentifier) {
    NSLog(@"%s with nil identifier", __PRETTY_FUNCTION__);
    return;
  }

  @synchronized([GTMSessionFetcher class]) {
    if (gSystemCompletionHandlers == nil && systemCompletionHandler != nil) {
      gSystemCompletionHandlers = [[NSMutableDictionary alloc] init];
    }
    // Use setValue: to remove the object if completionHandler is nil.
    [gSystemCompletionHandlers setValue:systemCompletionHandler
                                 forKey:sessionIdentifier];
  }
}

+ (GTM_NULLABLE GTMSessionFetcherSystemCompletionHandler)systemCompletionHandlerForSessionIdentifier:(NSString *)sessionIdentifier {
  if (!sessionIdentifier) {
    return nil;
  }
  @synchronized([GTMSessionFetcher class]) {
    return [gSystemCompletionHandlers objectForKey:sessionIdentifier];
  }
}
#endif  // TARGET_OS_IPHONE

#pragma mark Getters and Setters

@synthesize downloadResumeData = _downloadResumeData,
            configuration = _configuration,
            configurationBlock = _configurationBlock,
            sessionTask = _sessionTask,
            wasCreatedFromBackgroundSession = _wasCreatedFromBackgroundSession,
            sessionUserInfo = _sessionUserInfo,
            taskDescription = _taskDescription,
            taskPriority = _taskPriority,
            usingBackgroundSession = _usingBackgroundSession,
            canShareSession = _canShareSession,
            completionHandler = _completionHandler,
            credential = _credential,
            proxyCredential = _proxyCredential,
            bodyData = _bodyData,
            bodyLength = _bodyLength,
            service = _service,
            serviceHost = _serviceHost,
            accumulateDataBlock = _accumulateDataBlock,
            receivedProgressBlock = _receivedProgressBlock,
            downloadProgressBlock = _downloadProgressBlock,
            resumeDataBlock = _resumeDataBlock,
            didReceiveResponseBlock = _didReceiveResponseBlock,
            challengeBlock = _challengeBlock,
            willRedirectBlock = _willRedirectBlock,
            sendProgressBlock = _sendProgressBlock,
            willCacheURLResponseBlock = _willCacheURLResponseBlock,
            retryBlock = _retryBlock,
            retryFactor = _retryFactor,
            allowedInsecureSchemes = _allowedInsecureSchemes,
            allowLocalhostRequest = _allowLocalhostRequest,
            allowInvalidServerCertificates = _allowInvalidServerCertificates,
            cookieStorage = _cookieStorage,
            callbackQueue = _callbackQueue,
            initialBeginFetchDate = _initialBeginFetchDate,
            testBlock = _testBlock,
            testBlockAccumulateDataChunkCount = _testBlockAccumulateDataChunkCount,
            comment = _comment,
            log = _log;

#if !STRIP_GTM_FETCH_LOGGING
@synthesize redirectedFromURL = _redirectedFromURL,
            logRequestBody = _logRequestBody,
            logResponseBody = _logResponseBody,
            hasLoggedError = _hasLoggedError;
#endif

#if GTM_BACKGROUND_TASK_FETCHING
@synthesize backgroundTaskIdentifier = _backgroundTaskIdentifier,
            skipBackgroundTask = _skipBackgroundTask;
#endif

- (GTM_NULLABLE NSURLRequest *)request {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_request copy];
  }  // @synchronized(self)
}

- (void)setRequest:(GTM_NULLABLE NSURLRequest *)request {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (![self isFetchingUnsynchronized]) {
      _request = [request mutableCopy];
    } else {
      GTMSESSION_ASSERT_DEBUG(0, @"request may not be set after beginFetch has been invoked");
    }
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSMutableURLRequest *)mutableRequestForTesting {
  // Allow tests only to modify the request, useful during retries.
  return _request;
}

// Internal method for updating the request property such as on redirects.
- (void)updateMutableRequest:(GTM_NULLABLE NSMutableURLRequest *)request {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _request = request;
  }  // @synchronized(self)
}

// Set a header field value on the request. Header field value changes will not
// affect a fetch after the fetch has begun.
- (void)setRequestValue:(GTM_NULLABLE NSString *)value forHTTPHeaderField:(NSString *)field {
  if (![self isFetching]) {
    [self updateRequestValue:value forHTTPHeaderField:field];
  } else {
    GTMSESSION_ASSERT_DEBUG(0, @"request may not be set after beginFetch has been invoked");
  }
}

// Internal method for updating request headers.
- (void)updateRequestValue:(GTM_NULLABLE NSString *)value forHTTPHeaderField:(NSString *)field {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [_request setValue:value forHTTPHeaderField:field];
  }  // @synchronized(self)
}

- (void)setResponse:(GTM_NULLABLE NSURLResponse *)response {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _response = response;
  }  // @synchronized(self)
}

- (int64_t)bodyLength {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_bodyLength == NSURLSessionTransferSizeUnknown) {
      if (_bodyData) {
        _bodyLength = (int64_t)_bodyData.length;
      } else if (_bodyFileURL) {
        NSNumber *fileSizeNum = nil;
        NSError *fileSizeError = nil;
        if ([_bodyFileURL getResourceValue:&fileSizeNum
                                    forKey:NSURLFileSizeKey
                                     error:&fileSizeError]) {
          _bodyLength = [fileSizeNum longLongValue];
        }
      }
    }
    return _bodyLength;
  }  // @synchronized(self)
}

- (BOOL)useUploadTask {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _useUploadTask;
  }  // @synchronized(self)
}

- (void)setUseUploadTask:(BOOL)flag {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (flag != _useUploadTask) {
      GTMSESSION_ASSERT_DEBUG(![self isFetchingUnsynchronized],
                              @"useUploadTask should not change after beginFetch has been invoked");
      _useUploadTask = flag;
    }
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSURL *)bodyFileURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _bodyFileURL;
  }  // @synchronized(self)
}

- (void)setBodyFileURL:(GTM_NULLABLE NSURL *)fileURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // The comparison here is a trivial optimization and forgiveness for any client that
    // repeatedly sets the property, so it just uses pointer comparison rather than isEqual:.
    if (fileURL != _bodyFileURL) {
      GTMSESSION_ASSERT_DEBUG(![self isFetchingUnsynchronized],
                              @"fileURL should not change after beginFetch has been invoked");

      _bodyFileURL = fileURL;
    }
  }  // @synchronized(self)
}

- (GTM_NULLABLE GTMSessionFetcherBodyStreamProvider)bodyStreamProvider {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _bodyStreamProvider;
  }  // @synchronized(self)
}

- (void)setBodyStreamProvider:(GTM_NULLABLE GTMSessionFetcherBodyStreamProvider)block {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSESSION_ASSERT_DEBUG(![self isFetchingUnsynchronized],
                            @"stream provider should not change after beginFetch has been invoked");

    _bodyStreamProvider = [block copy];
  }  // @synchronized(self)
}

- (GTM_NULLABLE id<GTMFetcherAuthorizationProtocol>)authorizer {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _authorizer;
  }  // @synchronized(self)
}

- (void)setAuthorizer:(GTM_NULLABLE id<GTMFetcherAuthorizationProtocol>)authorizer {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (authorizer != _authorizer) {
      if ([self isFetchingUnsynchronized]) {
        GTMSESSION_ASSERT_DEBUG(0, @"authorizer should not change after beginFetch has been invoked");
      } else {
        _authorizer = authorizer;
      }
    }
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSData *)downloadedData {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _downloadedData;
  }  // @synchronized(self)
}

- (void)setDownloadedData:(GTM_NULLABLE NSData *)data {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _downloadedData = [data mutableCopy];
  }  // @synchronized(self)
}

- (int64_t)downloadedLength {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _downloadedLength;
  }  // @synchronized(self)
}

- (void)setDownloadedLength:(int64_t)length {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _downloadedLength = length;
  }  // @synchronized(self)
}

- (dispatch_queue_t GTM_NONNULL_TYPE)callbackQueue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _callbackQueue;
  }  // @synchronized(self)
}

- (void)setCallbackQueue:(dispatch_queue_t GTM_NULLABLE_TYPE)queue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _callbackQueue = queue ?: dispatch_get_main_queue();
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _session;
  }  // @synchronized(self)
}

- (NSInteger)servicePriority {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _servicePriority;
  }  // @synchronized(self)
}

- (void)setServicePriority:(NSInteger)value {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (value != _servicePriority) {
      GTMSESSION_ASSERT_DEBUG(![self isFetchingUnsynchronized],
        @"servicePriority should not change after beginFetch has been invoked");

      _servicePriority = value;
    }
  }  // @synchronized(self)
}


- (void)setSession:(GTM_NULLABLE NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _session = session;
  }  // @synchronized(self)
}

- (BOOL)canShareSession {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _canShareSession;
  }  // @synchronized(self)
}

- (void)setCanShareSession:(BOOL)flag {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _canShareSession = flag;
  }  // @synchronized(self)
}

- (BOOL)useBackgroundSession {
  // This reflects if the user requested a background session, not necessarily
  // if one was created. That is tracked with _usingBackgroundSession.
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _userRequestedBackgroundSession;
  }  // @synchronized(self)
}

- (void)setUseBackgroundSession:(BOOL)flag {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (flag != _userRequestedBackgroundSession) {
      GTMSESSION_ASSERT_DEBUG(![self isFetchingUnsynchronized],
          @"useBackgroundSession should not change after beginFetch has been invoked");

      _userRequestedBackgroundSession = flag;
    }
  }  // @synchronized(self)
}

- (BOOL)isUsingBackgroundSession {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _usingBackgroundSession;
  }  // @synchronized(self)
}

- (void)setUsingBackgroundSession:(BOOL)flag {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _usingBackgroundSession = flag;
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSURLSession *)sessionNeedingInvalidation {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _sessionNeedingInvalidation;
  }  // @synchronized(self)
}

- (void)setSessionNeedingInvalidation:(GTM_NULLABLE NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _sessionNeedingInvalidation = session;
  }  // @synchronized(self)
}

- (NSOperationQueue * GTM_NONNULL_TYPE)sessionDelegateQueue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _delegateQueue;
  }  // @synchronized(self)
}

- (void)setSessionDelegateQueue:(NSOperationQueue * GTM_NULLABLE_TYPE)queue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (queue != _delegateQueue) {
      if ([self isFetchingUnsynchronized]) {
        GTMSESSION_ASSERT_DEBUG(0, @"sessionDelegateQueue should not change after fetch begins");
      } else {
        _delegateQueue = queue ?: [NSOperationQueue mainQueue];
      }
    }
  }  // @synchronized(self)
}

- (BOOL)userStoppedFetching {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _userStoppedFetching;
  }  // @synchronized(self)
}

- (GTM_NULLABLE id)userData {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _userData;
  }  // @synchronized(self)
}

- (void)setUserData:(GTM_NULLABLE id)theObj {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _userData = theObj;
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSURL *)destinationFileURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _destinationFileURL;
  }  // @synchronized(self)
}

- (void)setDestinationFileURL:(GTM_NULLABLE NSURL *)destinationFileURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (((_destinationFileURL == nil) && (destinationFileURL == nil)) ||
        [_destinationFileURL isEqual:destinationFileURL]) {
      return;
    }
    if (_sessionIdentifier) {
      // This is something we don't expect to happen in production.
      // However if it ever happen, leave a system log.
      NSLog(@"%@: Destination File URL changed from (%@) to (%@) after session identifier has "
            @"been created.",
            [self class], _destinationFileURL, destinationFileURL);
#if DEBUG
      // On both the simulator and devices, the path can change to the download file, but the name
      // shouldn't change. Technically, this isn't supported in the fetcher, but the change of
      // URL is expected to happen only across development runs through Xcode.
      NSString *oldFilename = [_destinationFileURL lastPathComponent];
      NSString *newFilename = [destinationFileURL lastPathComponent];
      #pragma unused(oldFilename)
      #pragma unused(newFilename)
      GTMSESSION_ASSERT_DEBUG([oldFilename isEqualToString:newFilename],
          @"Destination File URL cannot be changed after session identifier has been created");
#endif
    }
    _destinationFileURL = destinationFileURL;
  }  // @synchronized(self)
}

- (void)setProperties:(GTM_NULLABLE NSDictionary *)dict {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _properties = [dict mutableCopy];
  }  // @synchronized(self)
}

- (GTM_NULLABLE NSDictionary *)properties {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _properties;
  }  // @synchronized(self)
}

- (void)setProperty:(GTM_NULLABLE id)obj forKey:(NSString *)key {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_properties == nil && obj != nil) {
      _properties = [[NSMutableDictionary alloc] init];
    }
    [_properties setValue:obj forKey:key];
  }  // @synchronized(self)
}

- (GTM_NULLABLE id)propertyForKey:(NSString *)key {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_properties objectForKey:key];
  }  // @synchronized(self)
}

- (void)addPropertiesFromDictionary:(NSDictionary *)dict {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_properties == nil && dict != nil) {
      [self setProperties:[dict mutableCopy]];
    } else {
      [_properties addEntriesFromDictionary:dict];
    }
  }  // @synchronized(self)
}

- (void)setCommentWithFormat:(id)format, ... {
#if !STRIP_GTM_FETCH_LOGGING
  NSString *result = format;
  if (format) {
    va_list argList;
    va_start(argList, format);

    result = [[NSString alloc] initWithFormat:format
                                    arguments:argList];
    va_end(argList);
  }
  [self setComment:result];
#endif
}

#if !STRIP_GTM_FETCH_LOGGING
- (NSData *)loggedStreamData {
  return _loggedStreamData;
}

- (void)appendLoggedStreamData:dataToAdd {
  if (!_loggedStreamData) {
    _loggedStreamData = [NSMutableData data];
  }
  [_loggedStreamData appendData:dataToAdd];
}

- (void)clearLoggedStreamData {
  _loggedStreamData = nil;
}

- (void)setDeferResponseBodyLogging:(BOOL)deferResponseBodyLogging {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (deferResponseBodyLogging != _deferResponseBodyLogging) {
      _deferResponseBodyLogging = deferResponseBodyLogging;
      if (!deferResponseBodyLogging && !self.hasLoggedError) {
        [_delegateQueue addOperationWithBlock:^{
          [self logNowWithError:nil];
        }];
      }
    }
  }  // @synchronized(self)
}

- (BOOL)deferResponseBodyLogging {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _deferResponseBodyLogging;
  }  // @synchronized(self)
}

#else
+ (void)setLoggingEnabled:(BOOL)flag {
}

+ (BOOL)isLoggingEnabled {
  return NO;
}
#endif // STRIP_GTM_FETCH_LOGGING

@end

@implementation GTMSessionFetcher (BackwardsCompatibilityOnly)

- (void)setCookieStorageMethod:(NSInteger)method {
  // For backwards compatibility with the old fetcher, we'll support the old constants.
  //
  // Clients using the GTMSessionFetcher class should set the cookie storage explicitly
  // themselves.
  NSHTTPCookieStorage *storage = nil;
  switch(method) {
    case 0:  // kGTMHTTPFetcherCookieStorageMethodStatic
             // nil storage will use [[self class] staticCookieStorage] when the fetch begins.
      break;
    case 1:  // kGTMHTTPFetcherCookieStorageMethodFetchHistory
             // Do nothing; use whatever was set by the fetcher service.
      return;
    case 2:  // kGTMHTTPFetcherCookieStorageMethodSystemDefault
      storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
      break;
    case 3:  // kGTMHTTPFetcherCookieStorageMethodNone
             // Create temporary storage for this fetcher only.
      storage = [[GTMSessionCookieStorage alloc] init];
      break;
    default:
      GTMSESSION_ASSERT_DEBUG(0, @"Invalid cookie storage method: %d", (int)method);
  }
  self.cookieStorage = storage;
}

@end

@implementation GTMSessionCookieStorage {
  NSMutableArray *_cookies;
  NSHTTPCookieAcceptPolicy _policy;
}

- (id)init {
  self = [super init];
  if (self != nil) {
    _cookies = [[NSMutableArray alloc] init];
  }
  return self;
}

- (GTM_NULLABLE NSArray *)cookies {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_cookies copy];
  }  // @synchronized(self)
}

- (void)setCookie:(NSHTTPCookie *)cookie {
  if (!cookie) return;
  if (_policy == NSHTTPCookieAcceptPolicyNever) return;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [self internalSetCookie:cookie];
  }  // @synchronized(self)
}

// Note: this should only be called from inside a @synchronized(self) block.
- (void)internalSetCookie:(NSHTTPCookie *)newCookie {
  GTMSessionCheckSynchronized(self);

  if (_policy == NSHTTPCookieAcceptPolicyNever) return;

  BOOL isValidCookie = (newCookie.name.length > 0
                        && newCookie.domain.length > 0
                        && newCookie.path.length > 0);
  GTMSESSION_ASSERT_DEBUG(isValidCookie, @"invalid cookie: %@", newCookie);

  if (isValidCookie) {
    // Remove the cookie if it's currently in the array.
    NSHTTPCookie *oldCookie = [self cookieMatchingCookie:newCookie];
    if (oldCookie) {
      [_cookies removeObjectIdenticalTo:oldCookie];
    }

    if (![[self class] hasCookieExpired:newCookie]) {
      [_cookies addObject:newCookie];
    }
  }
}

// Add all cookies in the new cookie array to the storage,
// replacing stored cookies as appropriate.
//
// Side effect: removes expired cookies from the storage array.
- (void)setCookies:(GTM_NULLABLE NSArray *)newCookies {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [self removeExpiredCookies];

    for (NSHTTPCookie *newCookie in newCookies) {
      [self internalSetCookie:newCookie];
    }
  }  // @synchronized(self)
}

- (void)setCookies:(NSArray *)cookies forURL:(GTM_NULLABLE NSURL *)URL mainDocumentURL:(GTM_NULLABLE NSURL *)mainDocumentURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_policy == NSHTTPCookieAcceptPolicyNever) {
      return;
    }

    if (_policy == NSHTTPCookieAcceptPolicyOnlyFromMainDocumentDomain) {
      NSString *mainHost = mainDocumentURL.host;
      NSString *associatedHost = URL.host;
      if (!mainHost || ![associatedHost hasSuffix:mainHost]) {
        return;
      }
    }
  }  // @synchronized(self)
  [self setCookies:cookies];
}

- (void)deleteCookie:(NSHTTPCookie *)cookie {
  if (!cookie) return;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSHTTPCookie *foundCookie = [self cookieMatchingCookie:cookie];
    if (foundCookie) {
      [_cookies removeObjectIdenticalTo:foundCookie];
    }
  }  // @synchronized(self)
}

// Retrieve all cookies appropriate for the given URL, considering
// domain, path, cookie name, expiration, security setting.
// Side effect: removed expired cookies from the storage array.
- (GTM_NULLABLE NSArray *)cookiesForURL:(NSURL *)theURL {
  NSMutableArray *foundCookies = nil;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [self removeExpiredCookies];

    // We'll prepend "." to the desired domain, since we want the
    // actual domain "nytimes.com" to still match the cookie domain
    // ".nytimes.com" when we check it below with hasSuffix.
    NSString *host = theURL.host.lowercaseString;
    NSString *path = theURL.path;
    NSString *scheme = [theURL scheme];

    NSString *requestingDomain = nil;
    BOOL isLocalhostRetrieval = NO;

    if (IsLocalhost(host)) {
      isLocalhostRetrieval = YES;
    } else {
      if (host.length > 0) {
        requestingDomain = [@"." stringByAppendingString:host];
      }
    }

    for (NSHTTPCookie *storedCookie in _cookies) {
      NSString *cookieDomain = storedCookie.domain.lowercaseString;
      NSString *cookiePath = storedCookie.path;
      BOOL cookieIsSecure = [storedCookie isSecure];

      BOOL isDomainOK;

      if (isLocalhostRetrieval) {
        // Prior to 10.5.6, the domain stored into NSHTTPCookies for localhost
        // is "localhost.local"
        isDomainOK = (IsLocalhost(cookieDomain)
                      || [cookieDomain isEqual:@"localhost.local"]);
      } else {
        // Ensure we're matching exact domain names. We prepended a dot to the
        // requesting domain, so we can also prepend one here if needed before
        // checking if the request contains the cookie domain.
        if (![cookieDomain hasPrefix:@"."]) {
          cookieDomain = [@"." stringByAppendingString:cookieDomain];
        }
        isDomainOK = [requestingDomain hasSuffix:cookieDomain];
      }

      BOOL isPathOK = [cookiePath isEqual:@"/"] || [path hasPrefix:cookiePath];
      BOOL isSecureOK = (!cookieIsSecure
                         || [scheme caseInsensitiveCompare:@"https"] == NSOrderedSame);

      if (isDomainOK && isPathOK && isSecureOK) {
        if (foundCookies == nil) {
          foundCookies = [NSMutableArray array];
        }
        [foundCookies addObject:storedCookie];
      }
    }
  }  // @synchronized(self)
  return foundCookies;
}

// Override methods from the NSHTTPCookieStorage (NSURLSessionTaskAdditions) category.
- (void)storeCookies:(NSArray *)cookies forTask:(NSURLSessionTask *)task {
  NSURLRequest *currentRequest = task.currentRequest;
  [self setCookies:cookies forURL:currentRequest.URL mainDocumentURL:nil];
}

- (void)getCookiesForTask:(NSURLSessionTask *)task
        completionHandler:(void (^)(GTM_NSArrayOf(NSHTTPCookie *) *))completionHandler {
  if (completionHandler) {
    NSURLRequest *currentRequest = task.currentRequest;
    NSURL *currentRequestURL = currentRequest.URL;
    NSArray *cookies = [self cookiesForURL:currentRequestURL];
    completionHandler(cookies);
  }
}

// Return a cookie from the array with the same name, domain, and path as the
// given cookie, or else return nil if none found.
//
// Both the cookie being tested and all cookies in the storage array should
// be valid (non-nil name, domains, paths).
//
// Note: this should only be called from inside a @synchronized(self) block
- (GTM_NULLABLE NSHTTPCookie *)cookieMatchingCookie:(NSHTTPCookie *)cookie {
  GTMSessionCheckSynchronized(self);

  NSString *name = cookie.name;
  NSString *domain = cookie.domain;
  NSString *path = cookie.path;

  GTMSESSION_ASSERT_DEBUG(name && domain && path,
                          @"Invalid stored cookie (name:%@ domain:%@ path:%@)", name, domain, path);

  for (NSHTTPCookie *storedCookie in _cookies) {
    if ([storedCookie.name isEqual:name]
        && [storedCookie.domain isEqual:domain]
        && [storedCookie.path isEqual:path]) {
      return storedCookie;
    }
  }
  return nil;
}

// Internal routine to remove any expired cookies from the array, excluding
// cookies with nil expirations.
//
// Note: this should only be called from inside a @synchronized(self) block
- (void)removeExpiredCookies {
  GTMSessionCheckSynchronized(self);

  // Count backwards since we're deleting items from the array
  for (NSInteger idx = (NSInteger)_cookies.count - 1; idx >= 0; idx--) {
    NSHTTPCookie *storedCookie = [_cookies objectAtIndex:(NSUInteger)idx];
    if ([[self class] hasCookieExpired:storedCookie]) {
      [_cookies removeObjectAtIndex:(NSUInteger)idx];
    }
  }
}

+ (BOOL)hasCookieExpired:(NSHTTPCookie *)cookie {
  NSDate *expiresDate = [cookie expiresDate];
  if (expiresDate == nil) {
    // Cookies seem to have a Expires property even when the expiresDate method returns nil.
    id expiresVal = [[cookie properties] objectForKey:NSHTTPCookieExpires];
    if ([expiresVal isKindOfClass:[NSDate class]]) {
      expiresDate = expiresVal;
    }
  }
  BOOL hasExpired = (expiresDate != nil && [expiresDate timeIntervalSinceNow] < 0);
  return hasExpired;
}

- (void)removeAllCookies {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [_cookies removeAllObjects];
  }  // @synchronized(self)
}

- (NSHTTPCookieAcceptPolicy)cookieAcceptPolicy {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _policy;
  }  // @synchronized(self)
}

- (void)setCookieAcceptPolicy:(NSHTTPCookieAcceptPolicy)cookieAcceptPolicy {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _policy = cookieAcceptPolicy;
  }  // @synchronized(self)
}

@end

void GTMSessionFetcherAssertValidSelector(id GTM_NULLABLE_TYPE obj, SEL GTM_NULLABLE_TYPE sel, ...) {
  // Verify that the object's selector is implemented with the proper
  // number and type of arguments
#if DEBUG
  va_list argList;
  va_start(argList, sel);

  if (obj && sel) {
    // Check that the selector is implemented
    if (![obj respondsToSelector:sel]) {
      NSLog(@"\"%@\" selector \"%@\" is unimplemented or misnamed",
                             NSStringFromClass([(id)obj class]),
                             NSStringFromSelector((SEL)sel));
      NSCAssert(0, @"callback selector unimplemented or misnamed");
    } else {
      const char *expectedArgType;
      unsigned int argCount = 2; // skip self and _cmd
      NSMethodSignature *sig = [obj methodSignatureForSelector:sel];

      // Check that each expected argument is present and of the correct type
      while ((expectedArgType = va_arg(argList, const char*)) != 0) {

        if ([sig numberOfArguments] > argCount) {
          const char *foundArgType = [sig getArgumentTypeAtIndex:argCount];

          if (0 != strncmp(foundArgType, expectedArgType, strlen(expectedArgType))) {
            NSLog(@"\"%@\" selector \"%@\" argument %d should be type %s",
                  NSStringFromClass([(id)obj class]),
                  NSStringFromSelector((SEL)sel), (argCount - 2), expectedArgType);
            NSCAssert(0, @"callback selector argument type mistake");
          }
        }
        argCount++;
      }

      // Check that the proper number of arguments are present in the selector
      if (argCount != [sig numberOfArguments]) {
        NSLog(@"\"%@\" selector \"%@\" should have %d arguments",
              NSStringFromClass([(id)obj class]),
              NSStringFromSelector((SEL)sel), (argCount - 2));
        NSCAssert(0, @"callback selector arguments incorrect");
      }
    }
  }

  va_end(argList);
#endif
}

NSString *GTMFetcherCleanedUserAgentString(NSString *str) {
  // Reference http://www.w3.org/Protocols/rfc2616/rfc2616-sec2.html
  // and http://www-archive.mozilla.org/build/user-agent-strings.html

  if (str == nil) return @"";

  NSMutableString *result = [NSMutableString stringWithString:str];

  // Replace spaces and commas with underscores
  [result replaceOccurrencesOfString:@" "
                          withString:@"_"
                             options:0
                               range:NSMakeRange(0, result.length)];
  [result replaceOccurrencesOfString:@","
                          withString:@"_"
                             options:0
                               range:NSMakeRange(0, result.length)];

  // Delete http token separators and remaining whitespace
  static NSCharacterSet *charsToDelete = nil;
  if (charsToDelete == nil) {
    // Make a set of unwanted characters
    NSString *const kSeparators = @"()<>@;:\\\"/[]?={}";

    NSMutableCharacterSet *mutableChars =
        [[NSCharacterSet whitespaceAndNewlineCharacterSet] mutableCopy];
    [mutableChars addCharactersInString:kSeparators];
    charsToDelete = [mutableChars copy]; // hang on to an immutable copy
  }

  while (1) {
    NSRange separatorRange = [result rangeOfCharacterFromSet:charsToDelete];
    if (separatorRange.location == NSNotFound) break;

    [result deleteCharactersInRange:separatorRange];
  };

  return result;
}

NSString *GTMFetcherSystemVersionString(void) {
  static NSString *sSavedSystemString;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // The Xcode 8 SDKs finally cleaned up this mess by providing TARGET_OS_OSX
    // and TARGET_OS_IOS, but to build with older SDKs, those don't exist and
    // instead one has to rely on TARGET_OS_MAC (which is true for iOS, watchOS,
    // and tvOS) and TARGET_OS_IPHONE (which is true for iOS, watchOS, tvOS). So
    // one has to order these carefully so you pick off the specific things
    // first.
    // If the code can ever assume Xcode 8 or higher (even when building for
    // older OSes), then
    //   TARGET_OS_MAC -> TARGET_OS_OSX
    //   TARGET_OS_IPHONE -> TARGET_OS_IOS
    //   TARGET_IPHONE_SIMULATOR -> TARGET_OS_SIMULATOR
#if TARGET_OS_WATCH
    // watchOS - WKInterfaceDevice

    WKInterfaceDevice *currentDevice = [WKInterfaceDevice currentDevice];

    NSString *rawModel = [currentDevice model];
    NSString *model = GTMFetcherCleanedUserAgentString(rawModel);

    NSString *systemVersion = [currentDevice systemVersion];

#if TARGET_OS_SIMULATOR
    NSString *hardwareModel = @"sim";
#else
    NSString *hardwareModel;
    struct utsname unameRecord;
    if (uname(&unameRecord) == 0) {
      NSString *machineName = @(unameRecord.machine);
      hardwareModel = GTMFetcherCleanedUserAgentString(machineName);
    }
    if (hardwareModel.length == 0) {
      hardwareModel = @"unk";
    }
#endif

    sSavedSystemString = [[NSString alloc] initWithFormat:@"%@/%@ hw/%@",
                          model, systemVersion, hardwareModel];
    // Example:  Apple_Watch/3.0 hw/Watch1_2
#elif TARGET_OS_TV || TARGET_OS_IPHONE
    // iOS and tvOS have UIDevice, use that.
    UIDevice *currentDevice = [UIDevice currentDevice];

    NSString *rawModel = [currentDevice model];
    NSString *model = GTMFetcherCleanedUserAgentString(rawModel);

    NSString *systemVersion = [currentDevice systemVersion];

#if TARGET_IPHONE_SIMULATOR || TARGET_OS_SIMULATOR
    NSString *hardwareModel = @"sim";
#else
    NSString *hardwareModel;
    struct utsname unameRecord;
    if (uname(&unameRecord) == 0) {
      NSString *machineName = @(unameRecord.machine);
      hardwareModel = GTMFetcherCleanedUserAgentString(machineName);
    }
    if (hardwareModel.length == 0) {
      hardwareModel = @"unk";
    }
#endif

    sSavedSystemString = [[NSString alloc] initWithFormat:@"%@/%@ hw/%@",
                          model, systemVersion, hardwareModel];
    // Example:  iPod_Touch/2.2 hw/iPod1_1
    // Example:  Apple_TV/9.2 hw/AppleTV5,3
#elif TARGET_OS_MAC
    // Mac build
    NSProcessInfo *procInfo = [NSProcessInfo processInfo];
#if !defined(MAC_OS_X_VERSION_10_10)
    BOOL hasOperatingSystemVersion = NO;
#elif MAC_OS_X_VERSION_MIN_REQUIRED < MAC_OS_X_VERSION_10_10
    BOOL hasOperatingSystemVersion =
        [procInfo respondsToSelector:@selector(operatingSystemVersion)];
#else
    BOOL hasOperatingSystemVersion = YES;
#endif
    NSString *versString;
    if (hasOperatingSystemVersion) {
#if defined(MAC_OS_X_VERSION_10_10)
      // A reference to NSOperatingSystemVersion requires the 10.10 SDK.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
// Disable unguarded availability warning as we can't use the @availability macro until we require
// all clients to build with Xcode 9 or above.
      NSOperatingSystemVersion version = procInfo.operatingSystemVersion;
#pragma clang diagnostic pop
      versString = [NSString stringWithFormat:@"%ld.%ld.%ld",
                    (long)version.majorVersion, (long)version.minorVersion,
                    (long)version.patchVersion];
#else
#pragma unused(procInfo)
#endif
    } else {
      // With Gestalt inexplicably deprecated in 10.8, we're reduced to reading
      // the system plist file.
      NSString *const kPath = @"/System/Library/CoreServices/SystemVersion.plist";
      NSDictionary *plist = [NSDictionary dictionaryWithContentsOfFile:kPath];
      versString = [plist objectForKey:@"ProductVersion"];
      if (versString.length == 0) {
        versString = @"10.?.?";
      }
    }

    sSavedSystemString = [[NSString alloc] initWithFormat:@"MacOSX/%@", versString];
#elif defined(_SYS_UTSNAME_H)
    // Foundation-only build
    struct utsname unameRecord;
    uname(&unameRecord);

    sSavedSystemString = [NSString stringWithFormat:@"%s/%s",
                          unameRecord.sysname, unameRecord.release]; // "Darwin/8.11.1"
#else
#error No branch taken for a default user agent
#endif
  });
  return sSavedSystemString;
}

NSString *GTMFetcherStandardUserAgentString(NSBundle * GTM_NULLABLE_TYPE bundle) {
  NSString *result = [NSString stringWithFormat:@"%@ %@",
                      GTMFetcherApplicationIdentifier(bundle),
                      GTMFetcherSystemVersionString()];
  return result;
}

NSString *GTMFetcherApplicationIdentifier(NSBundle * GTM_NULLABLE_TYPE bundle) {
  @synchronized([GTMSessionFetcher class]) {
    static NSMutableDictionary *sAppIDMap = nil;

    // If there's a bundle ID, use that; otherwise, use the process name
    if (bundle == nil) {
      bundle = [NSBundle mainBundle];
    }
    NSString *bundleID = [bundle bundleIdentifier];
    if (bundleID == nil) {
      bundleID = @"";
    }

    NSString *identifier = [sAppIDMap objectForKey:bundleID];
    if (identifier) return identifier;

    // Apps may add a string to the info.plist to uniquely identify different builds.
    identifier = [bundle objectForInfoDictionaryKey:@"GTMUserAgentID"];
    if (identifier.length == 0) {
      if (bundleID.length > 0) {
        identifier = bundleID;
      } else {
        // Fall back on the procname, prefixed by "proc" to flag that it's
        // autogenerated and perhaps unreliable
        NSString *procName = [[NSProcessInfo processInfo] processName];
        identifier = [NSString stringWithFormat:@"proc_%@", procName];
      }
    }

    // Clean up whitespace and special characters
    identifier = GTMFetcherCleanedUserAgentString(identifier);

    // If there's a version number, append that
    NSString *version = [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    if (version.length == 0) {
      version = [bundle objectForInfoDictionaryKey:@"CFBundleVersion"];
    }

    // Clean up whitespace and special characters
    version = GTMFetcherCleanedUserAgentString(version);

    // Glue the two together (cleanup done above or else cleanup would strip the
    // slash)
    if (version.length > 0) {
      identifier = [identifier stringByAppendingFormat:@"/%@", version];
    }

    if (sAppIDMap == nil) {
      sAppIDMap = [[NSMutableDictionary alloc] init];
    }
    [sAppIDMap setObject:identifier forKey:bundleID];
    return identifier;
  }
}

#if DEBUG && (!defined(NS_BLOCK_ASSERTIONS) || GTMSESSION_ASSERT_AS_LOG)
@implementation GTMSessionSyncMonitorInternal {
  NSValue *_objectKey;        // The synchronize target object.
  const char *_functionName;  // The function containing the monitored sync block.
}

- (instancetype)initWithSynchronizationObject:(id)object
                               allowRecursive:(BOOL)allowRecursive
                                 functionName:(const char *)functionName {
  self = [super init];
  if (self) {
    Class threadKey = [GTMSessionSyncMonitorInternal class];
    _objectKey = [NSValue valueWithNonretainedObject:object];
    _functionName = functionName;

    NSMutableDictionary *threadDict = [NSThread currentThread].threadDictionary;
    NSMutableDictionary *counters = threadDict[threadKey];
    if (counters == nil) {
      counters = [NSMutableDictionary dictionary];
      threadDict[(id)threadKey] = counters;
    }
    NSCountedSet *functionNamesCounter = counters[_objectKey];
    NSUInteger numberOfSyncingFunctions = functionNamesCounter.count;

    if (!allowRecursive) {
      BOOL isTopLevelSyncScope = (numberOfSyncingFunctions == 0);
      NSArray *stack = [NSThread callStackSymbols];
      GTMSESSION_ASSERT_DEBUG(isTopLevelSyncScope,
                              @"*** Recursive sync on %@ at %s; previous sync at %@\n%@",
                              [object class], functionName, functionNamesCounter.allObjects,
                              [stack subarrayWithRange:NSMakeRange(1, stack.count - 1)]);
    }

    if (!functionNamesCounter) {
      functionNamesCounter = [NSCountedSet set];
      counters[_objectKey] = functionNamesCounter;
    }
    [functionNamesCounter addObject:(id _Nonnull)@(functionName)];
  }
  return self;
}

- (void)dealloc {
  Class threadKey = [GTMSessionSyncMonitorInternal class];

  NSMutableDictionary *threadDict = [NSThread currentThread].threadDictionary;
  NSMutableDictionary *counters = threadDict[threadKey];
  NSCountedSet *functionNamesCounter = counters[_objectKey];
  NSString *functionNameStr = @(_functionName);
  NSUInteger numberOfSyncsByThisFunction = [functionNamesCounter countForObject:functionNameStr];
  NSArray *stack = [NSThread callStackSymbols];
  GTMSESSION_ASSERT_DEBUG(numberOfSyncsByThisFunction > 0, @"Sync not found on %@ at %s\n%@",
                          [_objectKey.nonretainedObjectValue class], _functionName,
                          [stack subarrayWithRange:NSMakeRange(1, stack.count - 1)]);
  [functionNamesCounter removeObject:functionNameStr];
  if (functionNamesCounter.count == 0) {
    [counters removeObjectForKey:_objectKey];
  }
}

+ (NSArray *)functionsHoldingSynchronizationOnObject:(id)object {
  Class threadKey = [GTMSessionSyncMonitorInternal class];
  NSValue *localObjectKey = [NSValue valueWithNonretainedObject:object];

  NSMutableDictionary *threadDict = [NSThread currentThread].threadDictionary;
  NSMutableDictionary *counters = threadDict[threadKey];
  NSCountedSet *functionNamesCounter = counters[localObjectKey];
  return functionNamesCounter.count > 0 ? functionNamesCounter.allObjects : nil;
}
@end
#endif  // DEBUG && (!defined(NS_BLOCK_ASSERTIONS) || GTMSESSION_ASSERT_AS_LOG)
GTM_ASSUME_NONNULL_END
