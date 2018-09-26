/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if GTM_INCLUDE_OAUTH2 || !GDATA_REQUIRE_SERVICE_INCLUDES

#import "GTMOAuth2Authentication.h"

// Extern strings

NSString *const kGTMOAuth2ServiceProviderGoogle = @"Google";

NSString *const kGTMOAuth2ErrorDomain  = @"com.google.GTMOAuth2";

NSString *const kGTMOAuth2ErrorMessageKey = @"error";
NSString *const kGTMOAuth2ErrorRequestKey = @"request";
NSString *const kGTMOAuth2ErrorJSONKey    = @"json";

// Notifications
NSString *const kGTMOAuth2FetchStarted        = @"kGTMOAuth2FetchStarted";
NSString *const kGTMOAuth2FetchStopped        = @"kGTMOAuth2FetchStopped";

NSString *const kGTMOAuth2FetcherKey          = @"fetcher";
NSString *const kGTMOAuth2FetchTypeKey        = @"FetchType";
NSString *const kGTMOAuth2FetchTypeToken      = @"token";
NSString *const kGTMOAuth2FetchTypeRefresh    = @"refresh";
NSString *const kGTMOAuth2FetchTypeAssertion  = @"assertion";
NSString *const kGTMOAuth2FetchTypeUserInfo   = @"userInfo";

NSString *const kGTMOAuth2ErrorKey                  = @"error";
NSString *const kGTMOAuth2ErrorObjectKey            = @"kGTMOAuth2ErrorObjectKey";

NSString *const kGTMOAuth2ErrorInvalidRequest       = @"invalid_request";
NSString *const kGTMOAuth2ErrorInvalidClient        = @"invalid_client";
NSString *const kGTMOAuth2ErrorInvalidGrant         = @"invalid_grant";
NSString *const kGTMOAuth2ErrorUnauthorizedClient   = @"unauthorized_client";
NSString *const kGTMOAuth2ErrorUnsupportedGrantType = @"unsupported_grant_type";
NSString *const kGTMOAuth2ErrorInvalidScope         = @"invalid_scope";

NSString *const kGTMOAuth2UserSignedIn              = @"kGTMOAuth2UserSignedIn";

NSString *const kGTMOAuth2AccessTokenRefreshed     = @"kGTMOAuth2AccessTokenRefreshed";
NSString *const kGTMOAuth2RefreshTokenChanged      = @"kGTMOAuth2RefreshTokenChanged";
NSString *const kGTMOAuth2AccessTokenRefreshFailed = @"kGTMOAuth2AccessTokenRefreshFailed";

NSString *const kGTMOAuth2WebViewStartedLoading = @"kGTMOAuth2WebViewStartedLoading";
NSString *const kGTMOAuth2WebViewStoppedLoading = @"kGTMOAuth2WebViewStoppedLoading";
NSString *const kGTMOAuth2WebViewKey            = @"kGTMOAuth2WebViewKey";
NSString *const kGTMOAuth2WebViewStopKindKey    = @"kGTMOAuth2WebViewStopKindKey";
NSString *const kGTMOAuth2WebViewFinished       = @"finished";
NSString *const kGTMOAuth2WebViewFailed         = @"failed";
NSString *const kGTMOAuth2WebViewCancelled      = @"cancelled";

NSString *const kGTMOAuth2NetworkLost         = @"kGTMOAuthNetworkLost";
NSString *const kGTMOAuth2NetworkFound        = @"kGTMOAuthNetworkFound";

// standard OAuth keys
static NSString *const kOAuth2AccessTokenKey   = @"access_token";
static NSString *const kOAuth2RefreshTokenKey  = @"refresh_token";
static NSString *const kOAuth2ScopeKey         = @"scope";
static NSString *const kOAuth2ErrorKey         = @"error";
static NSString *const kOAuth2TokenTypeKey     = @"token_type";
static NSString *const kOAuth2ExpiresInKey     = @"expires_in";
static NSString *const kOAuth2CodeKey          = @"code";
static NSString *const kOAuth2AssertionKey     = @"assertion";
static NSString *const kOAuth2RefreshScopeKey  = @"refreshScope";

// additional persistent keys
static NSString *const kServiceProviderKey     = @"serviceProvider";
static NSString *const kUserIDKey              = @"userID";
static NSString *const kUserEmailKey           = @"email";
static NSString *const kUserEmailIsVerifiedKey = @"isVerified";

// fetcher keys
static NSString *const kTokenFetchDelegateKey = @"delegate";
static NSString *const kTokenFetchSelectorKey = @"sel";

// wrapper class for requests needing authorization and their callbacks
@interface GTMOAuth2AuthorizationArgs : NSObject {
 @private
  NSMutableURLRequest *request_;
  id delegate_;
  SEL sel_;
  id completionHandler_;
  NSThread *thread_;
  NSError *error_;
}

@property (atomic, retain) NSMutableURLRequest *request;
@property (atomic, retain) id delegate;
@property (atomic, assign) SEL selector;
@property (atomic, copy) id completionHandler;
@property (atomic, retain) NSThread *thread;
@property (atomic, retain) NSError *error;

+ (GTMOAuth2AuthorizationArgs *)argsWithRequest:(NSMutableURLRequest *)req
                                       delegate:(id)delegate
                                       selector:(SEL)sel
                              completionHandler:(id)completionHandler
                                         thread:(NSThread *)thread;
@end

@implementation GTMOAuth2AuthorizationArgs

@synthesize request = request_,
            delegate = delegate_,
            selector = sel_,
            completionHandler = completionHandler_,
            thread = thread_,
            error = error_;

+ (GTMOAuth2AuthorizationArgs *)argsWithRequest:(NSMutableURLRequest *)req
                                       delegate:(id)delegate
                                       selector:(SEL)sel
                              completionHandler:(id)completionHandler
                                         thread:(NSThread *)thread {
  GTMOAuth2AuthorizationArgs *obj;
  obj = [[[GTMOAuth2AuthorizationArgs alloc] init] autorelease];
  obj.request = req;
  obj.delegate = delegate;
  obj.selector = sel;
  obj.completionHandler = completionHandler;
  obj.thread = thread;
  return obj;
}

- (void)dealloc {
  [request_ release];
  [delegate_ release];
  [completionHandler_ release];
  [thread_ release];
  [error_ release];

  [super dealloc];
}
@end


@interface GTMOAuth2Authentication ()

@property (atomic, retain) NSMutableArray *authorizationQueue;
@property (readonly) NSString *authorizationToken;

- (void)setKeysForResponseJSONData:(NSData *)data;

- (BOOL)authorizeRequestArgs:(GTMOAuth2AuthorizationArgs *)args;

- (BOOL)authorizeRequestImmediateArgs:(GTMOAuth2AuthorizationArgs *)args;

- (BOOL)shouldRefreshAccessToken;

- (void)updateExpirationDate;

- (void)tokenFetcher:(GTMOAuth2Fetcher *)fetcher
    finishedWithData:(NSData *)data
               error:(NSError *)error;

- (void)auth:(GTMOAuth2Authentication *)auth
finishedRefreshWithFetcher:(GTMOAuth2Fetcher *)fetcher
       error:(NSError *)error;

- (void)invokeCallbackArgs:(GTMOAuth2AuthorizationArgs *)args;

+ (void)invokeDelegate:(id)delegate
              selector:(SEL)sel
                object:(id)obj1
                object:(id)obj2
                object:(id)obj3;

+ (NSString *)unencodedOAuthParameterForString:(NSString *)str;
+ (NSString *)encodedQueryParametersForDictionary:(NSDictionary *)dict;

+ (NSDictionary *)dictionaryWithResponseData:(NSData *)data;

@end

@implementation GTMOAuth2Authentication

@synthesize clientID = clientID_,
            clientSecret = clientSecret_,
            redirectURI = redirectURI_,
            authorizationTokenKey = authorizationTokenKey_,
            tokenURL = tokenURL_,
            expirationDate = expirationDate_,
            additionalTokenRequestParameters = additionalTokenRequestParameters_,
            additionalGrantTypeRequestParameters = additionalGrantTypeRequestParameters_,
            refreshFetcher = refreshFetcher_,
            fetcherService = fetcherService_,
            shouldAuthorizeAllRequests = shouldAuthorizeAllRequests_,
            userData = userData_,
            properties = properties_,
            authorizationQueue = authorizationQueue_;

// Response parameters
@dynamic accessToken,
         refreshToken,
         code,
         assertion,
         refreshScope,
         errorString,
         tokenType,
         scope,
         expiresIn,
         serviceProvider,
         userEmail,
         userEmailIsVerified;

@dynamic canAuthorize;

+ (id)authenticationWithServiceProvider:(NSString *)serviceProvider
                               tokenURL:(NSURL *)tokenURL
                            redirectURI:(NSString *)redirectURI
                               clientID:(NSString *)clientID
                           clientSecret:(NSString *)clientSecret {
  GTMOAuth2Authentication *obj = [[[self alloc] init] autorelease];
  obj.serviceProvider = serviceProvider;
  obj.tokenURL = tokenURL;
  obj.redirectURI = redirectURI;
  obj.clientID = clientID;
  obj.clientSecret = clientSecret;
  return obj;
}

- (id)init {
  self = [super init];
  if (self) {
    authorizationQueue_ = [[NSMutableArray alloc] init];
    parameters_ = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (NSString *)description {
  NSArray *props = [NSArray arrayWithObjects:@"accessToken", @"refreshToken",
                    @"code", @"assertion", @"expirationDate", @"errorString",
                    nil];
  NSMutableString *valuesStr = [NSMutableString string];
  NSString *separator = @"";
  for (NSString *prop in props) {
    id result = [self valueForKey:prop];
    if (result) {
      [valuesStr appendFormat:@"%@%@=\"%@\"", separator, prop, result];
      separator = @", ";
    }
  }

  return [NSString stringWithFormat:@"%@ %p: {%@}",
          [self class], self, valuesStr];
}

- (void)dealloc {
  [clientID_ release];
  [clientSecret_ release];
  [redirectURI_ release];
  [parameters_ release];
  [authorizationTokenKey_ release];
  [tokenURL_ release];
  [expirationDate_ release];
  [additionalTokenRequestParameters_ release];
  [additionalGrantTypeRequestParameters_ release];
  [refreshFetcher_ release];
  [authorizationQueue_ release];
  [userData_ release];
  [properties_ release];

  [super dealloc];
}

#pragma mark -

- (void)setKeysForResponseDictionary:(NSDictionary *)dict {
  if (dict == nil) return;

  // If a new code or access token is being set, remove the old expiration
  NSString *newCode = [dict objectForKey:kOAuth2CodeKey];
  NSString *newAccessToken = [dict objectForKey:kOAuth2AccessTokenKey];
  if (newCode || newAccessToken) {
    self.expiresIn = nil;
  }

  BOOL didRefreshTokenChange = NO;
  NSString *refreshToken = [dict objectForKey:kOAuth2RefreshTokenKey];
  if (refreshToken) {
    NSString *priorRefreshToken = self.refreshToken;

    if (priorRefreshToken != refreshToken
        && (priorRefreshToken == nil
            || ![priorRefreshToken isEqual:refreshToken])) {
          didRefreshTokenChange = YES;
        }
  }

  [self addParametersFromDictionary:dict];
  [self updateExpirationDate];

  if (didRefreshTokenChange) {
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc postNotificationName:kGTMOAuth2RefreshTokenChanged
                      object:self
                    userInfo:nil];
  }
  // NSLog(@"keys set ----------------------------\n%@", dict);
}

- (void)setKeysForResponseString:(NSString *)str {
  NSDictionary *dict = [[self class] dictionaryWithResponseString:str];
  [self setKeysForResponseDictionary:dict];
}

- (void)setKeysForResponseJSONData:(NSData *)data {
  NSDictionary *dict = [[self class] dictionaryWithJSONData:data];
  [self setKeysForResponseDictionary:dict];
}

+ (NSDictionary *)dictionaryWithJSONData:(NSData *)data {
  NSError *error = nil;

  NSMutableDictionary *obj = [NSJSONSerialization JSONObjectWithData:data
                                                             options:NSJSONReadingMutableContainers
                                                               error:&error];
#if DEBUG
  if (error) {
    NSString *str = [[[NSString alloc] initWithData:data
                                           encoding:NSUTF8StringEncoding] autorelease];
    NSLog(@"NSJSONSerialization error %@ parsing %@", error, str);
  }
#endif
  return obj;
}

#pragma mark Authorizing Requests

// General entry point for authorizing requests

#if NS_BLOCKS_AVAILABLE
// Authorizing with a completion block
- (void)authorizeRequest:(NSMutableURLRequest *)request
       completionHandler:(void (^)(NSError *error))handler {

  GTMOAuth2AuthorizationArgs *args;
  args = [GTMOAuth2AuthorizationArgs argsWithRequest:request
                                            delegate:nil
                                            selector:NULL
                                   completionHandler:handler
                                              thread:[NSThread currentThread]];
  [self authorizeRequestArgs:args];
}
#endif

// Authorizing with a callback selector
//
// Selector has the signature
//   - (void)authentication:(GTMOAuth2Authentication *)auth
//                  request:(NSMutableURLRequest *)request
//        finishedWithError:(NSError *)error;
- (void)authorizeRequest:(NSMutableURLRequest *)request
                delegate:(id)delegate
       didFinishSelector:(SEL)sel {
  GTMOAuth2AssertValidSelector(delegate, sel,
                               @encode(GTMOAuth2Authentication *),
                               @encode(NSMutableURLRequest *),
                               @encode(NSError *), 0);

  GTMOAuth2AuthorizationArgs *args;
  args = [GTMOAuth2AuthorizationArgs argsWithRequest:request
                                            delegate:delegate
                                            selector:sel
                                   completionHandler:nil
                                              thread:[NSThread currentThread]];
  [self authorizeRequestArgs:args];
}

// Internal routine common to delegate and block invocations
- (BOOL)authorizeRequestArgs:(GTMOAuth2AuthorizationArgs *)args {
  BOOL didAttempt = NO;

  @synchronized(authorizationQueue_) {

    BOOL shouldRefresh = [self shouldRefreshAccessToken];

    if (shouldRefresh) {
      // attempt to refresh now; once we have a fresh access token, we will
      // authorize the request and call back to the user
      didAttempt = YES;

      if (self.refreshFetcher == nil) {
        // there's not already a refresh pending
        SEL finishedSel = @selector(auth:finishedRefreshWithFetcher:error:);
        self.refreshFetcher = [self beginTokenFetchWithDelegate:self
                                              didFinishSelector:finishedSel];
        if (self.refreshFetcher) {
          [authorizationQueue_ addObject:args];
        }
      } else {
        // there's already a refresh pending
        [authorizationQueue_ addObject:args];
      }
    }

    if (!shouldRefresh || self.refreshFetcher == nil) {
      // we're not fetching a new access token, so we can authorize the request
      // now
      didAttempt = [self authorizeRequestImmediateArgs:args];
    }
  }
  return didAttempt;
}

- (void)auth:(GTMOAuth2Authentication *)auth
finishedRefreshWithFetcher:(GTMOAuth2Fetcher *)fetcher
       error:(NSError *)error {
  @synchronized(authorizationQueue_) {
    // If there's an error, we want to try using the old access token anyway,
    // in case it's a backend problem preventing refresh, in which case
    // access tokens past their expiration date may still work

    self.refreshFetcher = nil;

    // Swap in a new auth queue in case the callbacks try to immediately auth
    // another request
    NSArray *pendingAuthQueue = [NSArray arrayWithArray:authorizationQueue_];
    [authorizationQueue_ removeAllObjects];

    BOOL hasAccessToken = ([self.accessToken length] > 0);

    NSString *noteName;
    NSDictionary *userInfo = nil;
    if (hasAccessToken && error == nil) {
      // Successful refresh.
      noteName = kGTMOAuth2AccessTokenRefreshed;
      userInfo = nil;
    } else {
      // Google's OAuth 2 implementation returns a 400 with JSON body
      // containing error key "invalid_grant" to indicate the refresh token
      // is invalid or has been revoked by the user.  We'll promote the
      // JSON error key's value for easy inspection by the observer.
      noteName = kGTMOAuth2AccessTokenRefreshFailed;
      NSString *jsonErr = nil;
      if ([error code] == kGTMOAuth2StatusBadRequest) {
        NSDictionary *json = [[error userInfo] objectForKey:kGTMOAuth2ErrorJSONKey];
        jsonErr = [json objectForKey:kGTMOAuth2ErrorMessageKey];
      }
      // error and jsonErr may be nil
      userInfo = [NSMutableDictionary dictionary];
      [userInfo setValue:error forKey:kGTMOAuth2ErrorObjectKey];
      [userInfo setValue:jsonErr forKey:kGTMOAuth2ErrorMessageKey];
    }
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc postNotificationName:noteName
                      object:self
                    userInfo:userInfo];

    for (GTMOAuth2AuthorizationArgs *args in pendingAuthQueue) {
      if (!hasAccessToken && args.error == nil) {
        args.error = error;
      }

      [self authorizeRequestImmediateArgs:args];
    }
  }
}

- (BOOL)isAuthorizingRequest:(NSURLRequest *)request {
  BOOL wasFound = NO;
  @synchronized(authorizationQueue_) {
    for (GTMOAuth2AuthorizationArgs *args in authorizationQueue_) {
      if ([args request] == request) {
        wasFound = YES;
        break;
      }
    }
  }
  return wasFound;
}

- (BOOL)isAuthorizedRequest:(NSURLRequest *)request {
  NSString *authStr = [request valueForHTTPHeaderField:@"Authorization"];
  return ([authStr length] > 0);
}

- (void)stopAuthorization {
  @synchronized(authorizationQueue_) {
    [authorizationQueue_ removeAllObjects];

    [self.refreshFetcher stopFetching];
    self.refreshFetcher = nil;
  }
}

- (void)stopAuthorizationForRequest:(NSURLRequest *)request {
  @synchronized(authorizationQueue_) {
    NSUInteger argIndex = 0;
    BOOL found = NO;
    for (GTMOAuth2AuthorizationArgs *args in authorizationQueue_) {
      if ([args request] == request) {
        found = YES;
        break;
      }
      argIndex++;
    }

    if (found) {
      [authorizationQueue_ removeObjectAtIndex:argIndex];

      // If the queue is now empty, go ahead and stop the fetcher.
      if ([authorizationQueue_ count] == 0) {
        [self stopAuthorization];
      }
    }
  }
}

- (BOOL)authorizeRequestImmediateArgs:(GTMOAuth2AuthorizationArgs *)args {
  // This authorization entry point never attempts to refresh the access token,
  // but does call the completion routine

  NSMutableURLRequest *request = args.request;

  NSURL *requestURL = [request URL];
  NSString *scheme = [requestURL scheme];
  BOOL isAuthorizableRequest = (requestURL == nil)
    || (scheme != nil && [scheme caseInsensitiveCompare:@"https"] == NSOrderedSame)
    || [requestURL isFileURL]
    || self.shouldAuthorizeAllRequests;
  if (!isAuthorizableRequest) {
    // Request is not https, a local file, or nil, so may be insecure
    //
    // The NSError will be created below
#if DEBUG
    NSLog(@"Cannot authorize request with scheme %@ (%@)", scheme, request);
#endif
  }

  // Get the access token.
  NSString *accessToken = self.authorizationToken;
  if (isAuthorizableRequest && [accessToken length] > 0) {
    if (request) {
      // we have a likely valid access token
      NSString *value = [NSString stringWithFormat:@"%s %@",
                         GTM_OAUTH2_BEARER, accessToken];
      [request setValue:value forHTTPHeaderField:@"Authorization"];
    }

    // We've authorized the request, even if the previous refresh
    // failed with an error
    args.error = nil;
  } else if (args.error == nil) {
    NSDictionary *userInfo = nil;
    if (request) {
      userInfo = [NSDictionary dictionaryWithObject:request
                                             forKey:kGTMOAuth2ErrorRequestKey];
    }
    NSInteger code = (isAuthorizableRequest ?
                      GTMOAuth2ErrorAuthorizationFailed :
                      GTMOAuth2ErrorUnauthorizableRequest);
    args.error = [NSError errorWithDomain:kGTMOAuth2ErrorDomain
                                     code:code
                                 userInfo:userInfo];
  }

  // Invoke any callbacks on the proper thread
  if (args.delegate || args.completionHandler) {
    NSThread *targetThread = args.thread;
    BOOL isSameThread = [targetThread isEqual:[NSThread currentThread]];
    if (isSameThread) {
      [self invokeCallbackArgs:args];
    } else {
      // If the fetcher service can provide a callback queue, we'll use that
      // (or if it's nil, we'll use the main thread) for callbacks.
#if GTM_USE_SESSION_FETCHER
      BOOL useCallbackQueue = YES;
#else
      BOOL useCallbackQueue = [self.fetcherService respondsToSelector:@selector(callbackQueue)];
#endif
      if (useCallbackQueue) {
        dispatch_queue_t callbackQueue = self.fetcherService.callbackQueue;
        if (!callbackQueue) {
          callbackQueue = dispatch_get_main_queue();
        }
        dispatch_async(callbackQueue, ^{
          [self invokeCallbackArgs:args];
        });
      } else {
#if !GTM_USE_SESSION_FETCHER
        // We might have an old fetcher service; we'll use its delegateQueue for the callback,
        // if that's available, else we'll hope the original thread has a spinning run loop.
        SEL sel = @selector(invokeCallbackArgs:);
        NSOperationQueue *delegateQueue = self.fetcherService.delegateQueue;
        if (delegateQueue) {
          NSInvocationOperation *op =
              [[[NSInvocationOperation alloc] initWithTarget:self
                                                    selector:sel
                                                      object:args] autorelease];
          [delegateQueue addOperation:op];
        } else {
          [self performSelector:sel
                       onThread:targetThread
                     withObject:args
                  waitUntilDone:NO];
        }
#endif // !GTM_USE_SESSION_FETCHER
      }
    }
  }

  BOOL didAuth = (args.error == nil);
  return didAuth;
}

- (void)invokeCallbackArgs:(GTMOAuth2AuthorizationArgs *)args {
  // Invoke the callbacks
  NSError *error = args.error;

  id delegate = args.delegate;
  SEL sel = args.selector;
  if (delegate && sel) {
    NSMutableURLRequest *request = args.request;

    NSMethodSignature *sig = [delegate methodSignatureForSelector:sel];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
    [invocation setSelector:sel];
    [invocation setTarget:delegate];
    [invocation setArgument:&self atIndex:2];
    [invocation setArgument:&request atIndex:3];
    [invocation setArgument:&error atIndex:4];
    [invocation invoke];
  }

#if NS_BLOCKS_AVAILABLE
  id handler = args.completionHandler;
  if (handler) {
    void (^authCompletionBlock)(NSError *) = handler;
    authCompletionBlock(error);
  }
#endif
}

- (BOOL)authorizeRequest:(NSMutableURLRequest *)request {
  // Entry point for synchronous authorization mechanisms
  GTMOAuth2AuthorizationArgs *args;
  args = [GTMOAuth2AuthorizationArgs argsWithRequest:request
                                            delegate:nil
                                            selector:NULL
                                   completionHandler:nil
                                              thread:[NSThread currentThread]];
  return [self authorizeRequestImmediateArgs:args];
}

- (BOOL)canAuthorize {
  NSString *token = self.refreshToken;
  if (token == nil) {
    // For services which do not support refresh tokens, we'll just check
    // the access token.
    token = self.authorizationToken;
  }
  BOOL canAuth = [token length] > 0;
  return canAuth;
}

- (BOOL)shouldRefreshAccessToken {
  // We should refresh the access token when it's missing or nearly expired
  // and we have a refresh token
  BOOL shouldRefresh = NO;
  NSString *accessToken = self.accessToken;
  NSString *refreshToken = self.refreshToken;
  NSString *assertion = self.assertion;
  NSString *code = self.code;

  BOOL hasRefreshToken = ([refreshToken length] > 0);
  BOOL hasAccessToken = ([accessToken length] > 0);
  BOOL hasAssertion = ([assertion length] > 0);
  BOOL hasCode = ([code length] > 0);

  // Determine if we need to refresh the access token
  if (hasRefreshToken || hasAssertion || hasCode) {
    if (!hasAccessToken) {
      shouldRefresh = YES;
    } else {
      // We'll consider the token expired if it expires 60 seconds from now
      // or earlier
      NSDate *expirationDate = self.expirationDate;
      NSTimeInterval timeToExpire = [expirationDate timeIntervalSinceNow];
      if (expirationDate == nil || timeToExpire < 60.0) {
        // access token has expired, or will in a few seconds
        shouldRefresh = YES;
      }
    }
  }
  return shouldRefresh;
}

- (void)waitForCompletionWithTimeout:(NSTimeInterval)timeoutInSeconds {
  // If there is a refresh fetcher pending, wait for it.
  //
  // This is only intended for unit test or for use in command-line tools.
  GTMOAuth2Fetcher *fetcher = self.refreshFetcher;
  [fetcher waitForCompletionWithTimeout:timeoutInSeconds];
}

#pragma mark Token Fetch

- (NSString *)userAgent {
  NSBundle *bundle = [NSBundle mainBundle];
  NSString *appID = [bundle bundleIdentifier];

  NSString *version = [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  if (version == nil) {
    version = [bundle objectForInfoDictionaryKey:@"CFBundleVersion"];
  }

  if (appID && version) {
    appID = [appID stringByAppendingFormat:@"/%@", version];
  }

  NSString *userAgent = @"gtm-oauth2";
  if (appID) {
    userAgent = [userAgent stringByAppendingFormat:@" %@", appID];
  }
  return userAgent;
}

- (GTMOAuth2Fetcher *)beginTokenFetchWithDelegate:(id)delegate
                              didFinishSelector:(SEL)finishedSel {

  NSMutableDictionary *paramsDict = [NSMutableDictionary dictionary];

  NSString *fetchType;

  NSString *refreshToken = self.refreshToken;
  NSString *code = self.code;
  NSString *assertion = self.assertion;
  NSString *grantType = nil;

  if (refreshToken) {
    // We have a refresh token
    grantType = @"refresh_token";
    [paramsDict setObject:refreshToken forKey:@"refresh_token"];

    NSString *refreshScope = self.refreshScope;
    if ([refreshScope length] > 0) {
      [paramsDict setObject:refreshScope forKey:@"scope"];
    }

    fetchType = kGTMOAuth2FetchTypeRefresh;
  } else if (code) {
    // We have a code string
    grantType = @"authorization_code";
    [paramsDict setObject:code forKey:@"code"];

    NSString *redirectURI = self.redirectURI;
    if ([redirectURI length] > 0) {
      [paramsDict setObject:redirectURI forKey:@"redirect_uri"];
    }

    NSString *scope = self.scope;
    if ([scope length] > 0) {
      [paramsDict setObject:scope forKey:@"scope"];
    }

    // This code doesn't set the "state" value for verifying the redirect as
    // described at
    //   https://developers.google.com/identity/protocols/OpenIDConnect#state-param
    // for two reasons:
    //
    // 1. Sign-in happens entirely in a WebView controlled by the app
    //
    // 2. For sign in to Google services, the completion of sign in is
    //    determined not by redirect but rather by a change in document.title
    //    to a string containing a code or error (see the window/view controller).

    fetchType = kGTMOAuth2FetchTypeToken;
  } else if (assertion) {
    // We have an assertion string
    grantType = @"http://oauth.net/grant_type/jwt/1.0/bearer";
    [paramsDict setObject:assertion forKey:@"assertion"];
    fetchType = kGTMOAuth2FetchTypeAssertion;
  } else {
#if DEBUG
    NSAssert(0, @"unexpected lack of code or refresh token for fetching");
#endif
    return nil;
  }
  [paramsDict setObject:grantType forKey:@"grant_type"];

  NSString *clientID = self.clientID;
  if ([clientID length] > 0) {
    [paramsDict setObject:clientID forKey:@"client_id"];
  }

  NSString *clientSecret = self.clientSecret;
  if ([clientSecret length] > 0) {
    [paramsDict setObject:clientSecret forKey:@"client_secret"];
  }

  NSDictionary *additionalParams = self.additionalTokenRequestParameters;
  if (additionalParams) {
    [paramsDict addEntriesFromDictionary:additionalParams];
  }
  NSDictionary *grantTypeParams =
    [self.additionalGrantTypeRequestParameters objectForKey:grantType];
  if (grantTypeParams) {
    [paramsDict addEntriesFromDictionary:grantTypeParams];
  }

  NSString *paramStr = [[self class] encodedQueryParametersForDictionary:paramsDict];
  NSData *paramData = [paramStr dataUsingEncoding:NSUTF8StringEncoding];

  NSURL *tokenURL = self.tokenURL;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:tokenURL];
  [request setValue:@"application/x-www-form-urlencoded"
 forHTTPHeaderField:@"Content-Type"];

  NSString *userAgent = [self userAgent];
  [request setValue:userAgent forHTTPHeaderField:@"User-Agent"];

  GTMOAuth2Fetcher *fetcher;
  id <GTMOAuth2FetcherServiceProtocol> fetcherService = self.fetcherService;
  if (fetcherService) {
    fetcher = (GTMOAuth2Fetcher *)[fetcherService fetcherWithRequest:request];

    // Don't use an authorizer for an auth token fetch
    fetcher.authorizer = nil;
  } else {
    fetcher = [GTMOAuth2Fetcher fetcherWithRequest:request];
  }

#if !STRIP_GTM_FETCH_LOGGING
  // The user email address is known at token refresh time, not during the initial code exchange.
  NSString *userEmail = [self userEmail];
  NSString *forStr = userEmail ? [NSString stringWithFormat:@"for \"%@\"", userEmail] : @"";
  [fetcher setCommentWithFormat:@"GTMOAuth2 %@ fetch to %@ %@", fetchType, [tokenURL host], forStr];
#endif

  fetcher.bodyData = paramData;
  fetcher.retryEnabled = YES;
  fetcher.maxRetryInterval = 15.0;
  fetcher.servicePriority = NSIntegerMin;  // Exempt from maxRunningFetchersPerHost delay.

  // Fetcher properties will retain the delegate
  [fetcher setProperty:delegate forKey:kTokenFetchDelegateKey];
  if (finishedSel) {
    NSString *selStr = NSStringFromSelector(finishedSel);
    [fetcher setProperty:selStr forKey:kTokenFetchSelectorKey];
  }

  [fetcher beginFetchWithDelegate:self
                didFinishSelector:@selector(tokenFetcher:finishedWithData:error:)];

  [self notifyFetchIsRunning:YES fetcher:fetcher type:fetchType];
  return fetcher;
}

- (void)tokenFetcher:(GTMOAuth2Fetcher *)fetcher
    finishedWithData:(NSData *)data
               error:(NSError *)error {
  [self notifyFetchIsRunning:NO fetcher:fetcher type:nil];

  NSDictionary *responseHeaders = [fetcher responseHeaders];
  NSString *responseType = [responseHeaders valueForKey:@"Content-Type"];
  // "text/javascript" supports Dropbox's out-of-spec OAuth 2.
  BOOL isResponseJSON = ([responseType hasPrefix:@"application/json"] ||
                         [responseType hasPrefix:@"text/javascript"]);
  BOOL hasData = ([data length] > 0);

  if (error) {
    // Failed. If the error body is JSON, parse it and add it to the error's
    // userInfo dictionary.
    if (hasData) {
      if (isResponseJSON) {
        NSDictionary *errorJson = [[self class] dictionaryWithJSONData:data];
        if ([errorJson count] > 0) {
#if DEBUG
          NSLog(@"Error %@\nError data:\n%@", error, errorJson);
#endif
          // Add the JSON error body to the userInfo of the error
          NSMutableDictionary *userInfo;
          userInfo = [NSMutableDictionary dictionaryWithObject:errorJson
                                                        forKey:kGTMOAuth2ErrorJSONKey];
          NSDictionary *prevUserInfo = [error userInfo];
          if (prevUserInfo) {
            [userInfo addEntriesFromDictionary:prevUserInfo];
          }
          error = [NSError errorWithDomain:[error domain]
                                      code:[error code]
                                  userInfo:userInfo];
        }
      }
    }
  } else {
    // Succeeded; we have the requested token.
#if DEBUG
    NSAssert(hasData, @"data missing in token response");
#endif

    if (hasData) {
      if (isResponseJSON) {
        [self setKeysForResponseJSONData:data];
      } else {
        // Support for legacy token servers that return form-urlencoded data
        NSString *dataStr = [[[NSString alloc] initWithData:data
                                                   encoding:NSUTF8StringEncoding] autorelease];
        [self setKeysForResponseString:dataStr];
      }

#if DEBUG
      // Watch for token exchanges that return a non-bearer or unlabeled token
      NSString *tokenType = [self tokenType];
      if (tokenType == nil
          || [tokenType caseInsensitiveCompare:@"bearer"] != NSOrderedSame) {
        NSLog(@"GTMOAuth2: Unexpected token type: %@", tokenType);
      }
#endif
    }
  }

  id delegate = [fetcher propertyForKey:kTokenFetchDelegateKey];
  SEL sel = NULL;
  NSString *selStr = [fetcher propertyForKey:kTokenFetchSelectorKey];
  if (selStr) sel = NSSelectorFromString(selStr);

  [[self class] invokeDelegate:delegate
                      selector:sel
                        object:self
                        object:fetcher
                        object:error];

  // Prevent a circular reference from retaining the delegate
  [fetcher setProperty:nil forKey:kTokenFetchDelegateKey];
}

#pragma mark Fetch Notifications

- (void)notifyFetchIsRunning:(BOOL)isStarting
                     fetcher:(GTMOAuth2Fetcher *)fetcher
                        type:(NSString *)fetchType {
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

  NSString *name = (isStarting ? kGTMOAuth2FetchStarted : kGTMOAuth2FetchStopped);
  NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:
                        fetcher, kGTMOAuth2FetcherKey,
                        fetchType, kGTMOAuth2FetchTypeKey, // fetchType may be nil
                        nil];
  [nc postNotificationName:name
                    object:self
                  userInfo:dict];
}

#pragma mark Persistent Response Strings

- (void)setKeysForPersistenceResponseString:(NSString *)str {
  // All persistence keys can be set directly as if returned by a server
  [self setKeysForResponseString:str];
}

// This returns a "response string" that can be passed later to
// setKeysForResponseString: to reuse an old access token in a new auth object
- (NSString *)persistenceResponseString {
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:4];

  NSString *refreshToken = self.refreshToken;
  NSString *accessToken = nil;
  if (refreshToken == nil) {
    // We store the access token only for services that do not support refresh
    // tokens; otherwise, we assume the access token is too perishable to
    // be worth storing
    accessToken = self.accessToken;
  }

  // Any nil values will not set a dictionary entry
  [dict setValue:refreshToken forKey:kOAuth2RefreshTokenKey];
  [dict setValue:accessToken forKey:kOAuth2AccessTokenKey];
  [dict setValue:self.serviceProvider forKey:kServiceProviderKey];
  [dict setValue:self.userID forKey:kUserIDKey];
  [dict setValue:self.userEmail forKey:kUserEmailKey];
  [dict setValue:self.userEmailIsVerified forKey:kUserEmailIsVerifiedKey];
  [dict setValue:self.scope forKey:kOAuth2ScopeKey];

  NSString *result = [[self class] encodedQueryParametersForDictionary:dict];
  return result;
}

- (BOOL)primeForRefresh {
  if (self.refreshToken == nil) {
    // Cannot refresh without a refresh token
    return NO;
  }
  self.accessToken = nil;
  self.expiresIn = nil;
  self.expirationDate = nil;
  self.errorString = nil;
  return YES;
}

- (void)reset {
  // Reset all per-authorization values
  self.code = nil;
  self.accessToken = nil;
  self.refreshToken = nil;
  self.assertion = nil;
  self.expiresIn = nil;
  self.errorString = nil;
  self.expirationDate = nil;
  self.userEmail = nil;
  self.userEmailIsVerified = nil;
  self.authorizationTokenKey = nil;
}

#pragma mark Accessors for Response Parameters

- (NSDictionary *)parameters {
  @synchronized(parameters_) {
    return [[parameters_ copy] autorelease];
  }
}

- (NSString *)authorizationToken {
  // The token used for authorization is typically the access token unless
  // the user has specified that an alternative parameter be used.
  NSString *authorizationToken;
  NSString *authTokenKey = self.authorizationTokenKey;
  if (authTokenKey != nil) {
    authorizationToken = [self parameterForKey:authTokenKey];
  } else {
    authorizationToken = self.accessToken;
  }
  return authorizationToken;
}

- (NSString *)accessToken {
  return [self parameterForKey:kOAuth2AccessTokenKey];
}

- (void)setAccessToken:(NSString *)str {
  [self setParameter:str forKey:kOAuth2AccessTokenKey];
}

- (NSString *)refreshToken {
  return [self parameterForKey:kOAuth2RefreshTokenKey];
}

- (void)setRefreshToken:(NSString *)str {
  [self setParameter:str forKey:kOAuth2RefreshTokenKey];
}

- (NSString *)code {
  return [self parameterForKey:kOAuth2CodeKey];
}

- (void)setCode:(NSString *)str {
  [self setParameter:str forKey:kOAuth2CodeKey];
}

- (NSString *)assertion {
  return [self parameterForKey:kOAuth2AssertionKey];
}

- (void)setAssertion:(NSString *)str {
  [self setParameter:str forKey:kOAuth2AssertionKey];
}

- (NSString *)refreshScope {
  return [self parameterForKey:kOAuth2RefreshScopeKey];
}

- (void)setRefreshScope:(NSString *)str {
  [self setParameter:str forKey:kOAuth2RefreshScopeKey];
}

- (NSString *)errorString {
  return [self parameterForKey:kOAuth2ErrorKey];
}

- (void)setErrorString:(NSString *)str {
  [self setParameter:str forKey:kOAuth2ErrorKey];
}

- (NSString *)tokenType {
  return [self parameterForKey:kOAuth2TokenTypeKey];
}

- (void)setTokenType:(NSString *)str {
  [self setParameter:str forKey:kOAuth2TokenTypeKey];
}

- (NSString *)scope {
  return [self parameterForKey:kOAuth2ScopeKey];
}

- (void)setScope:(NSString *)str {
  [self setParameter:str forKey:kOAuth2ScopeKey];
}

- (NSNumber *)expiresIn {
  id value = [self parameterForKey:kOAuth2ExpiresInKey];
  if ([value isKindOfClass:[NSString class]]) {
    value = [NSNumber numberWithInteger:[value integerValue]];
  }
  return value;
}

- (void)setExpiresIn:(NSNumber *)num {
  [self setParameter:num forKey:kOAuth2ExpiresInKey];
  [self updateExpirationDate];
}

- (void)updateExpirationDate {
  // Update our absolute expiration time to something close to when
  // the server expects the expiration
  NSDate *date = nil;
  NSNumber *expiresIn = self.expiresIn;
  if (expiresIn != nil) {
    unsigned long deltaSeconds = [expiresIn unsignedLongValue];
    if (deltaSeconds > 0) {
      date = [NSDate dateWithTimeIntervalSinceNow:deltaSeconds];
    }
  }
  self.expirationDate = date;
}

//
// Keys custom to this class, not part of OAuth 2
//

- (NSString *)serviceProvider {
  return [self parameterForKey:kServiceProviderKey];
}

- (void)setServiceProvider:(NSString *)str {
  [self setParameter:str forKey:kServiceProviderKey];
}

- (NSString *)userID {
  return [self parameterForKey:kUserIDKey];
}

- (void)setUserID:(NSString *)str {
  [self setParameter:str forKey:kUserIDKey];
}

- (NSString *)userEmail {
  return [self parameterForKey:kUserEmailKey];
}

- (void)setUserEmail:(NSString *)str {
  [self setParameter:str forKey:kUserEmailKey];
}

- (NSString *)userEmailIsVerified {
  return [self parameterForKey:kUserEmailIsVerifiedKey];
}

- (void)setUserEmailIsVerified:(NSString *)str {
  [self setParameter:str forKey:kUserEmailIsVerifiedKey];
}

#pragma mark Parameters

- (id)parameterForKey:(NSString *)key {
  @synchronized(parameters_) {
    return [parameters_ objectForKey:key];
  }
}

- (void)setParameter:(id)parameter forKey:(NSString *)key {
  @synchronized(parameters_) {
    [parameters_ setValue:parameter forKey:key];
  }
}

- (void)addParametersFromDictionary:(NSDictionary *)dict {
  @synchronized(parameters_) {
    [parameters_ addEntriesFromDictionary:dict];
  }
}

#pragma mark User Properties

- (void)setProperty:(id)obj forKey:(NSString *)key {
  if (obj == nil) {
    // User passed in nil, so delete the property
    [properties_ removeObjectForKey:key];
  } else {
    // Be sure the property dictionary exists
    if (properties_ == nil) {
      [self setProperties:[NSMutableDictionary dictionary]];
    }
    [properties_ setObject:obj forKey:key];
  }
}

- (id)propertyForKey:(NSString *)key {
  id obj = [properties_ objectForKey:key];

  // Be sure the returned pointer has the life of the autorelease pool,
  // in case self is released immediately
  return [[obj retain] autorelease];
}

#pragma mark Utility Routines

+ (NSString *)encodedOAuthValueForString:(NSString *)originalString {
  // For parameters, we'll explicitly leave spaces unescaped now, and replace
  // them with +'s
  NSString *const kForceEscape = @"!*'();:@&=+$,/?%#[]";

#if (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_9) && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_9) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_7_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0)
  // Builds targeting iOS 7/OS X 10.9 and higher only.
  NSMutableCharacterSet *cs =
      [[[NSCharacterSet URLQueryAllowedCharacterSet] mutableCopy] autorelease];
  [cs removeCharactersInString:kForceEscape];

  NSString *escapedStr = [originalString stringByAddingPercentEncodingWithAllowedCharacters:cs];
#else
  // Builds targeting iOS 6/OS X 10.8.
  CFStringRef leaveUnescaped = NULL;

  CFStringRef escapedStr = NULL;
  if (originalString) {
    escapedStr = CFURLCreateStringByAddingPercentEscapes(kCFAllocatorDefault,
                                                         (CFStringRef)originalString,
                                                         leaveUnescaped,
                                                         (CFStringRef)kForceEscape,
                                                         kCFStringEncodingUTF8);
    [(NSString *)escapedStr autorelease];
  }
#endif

  return (NSString *)escapedStr;
}

+ (NSString *)encodedQueryParametersForDictionary:(NSDictionary *)dict {
  // Make a string like "cat=fluffy&dog=spot"
  NSMutableString *result = [NSMutableString string];
  NSArray *sortedKeys = [[dict allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
  NSString *joiner = @"";
  for (NSString *key in sortedKeys) {
    NSString *value = [dict objectForKey:key];
    NSString *encodedValue = [self encodedOAuthValueForString:value];
    NSString *encodedKey = [self encodedOAuthValueForString:key];
    [result appendFormat:@"%@%@=%@", joiner, encodedKey, encodedValue];
    joiner = @"&";
  }
  return result;
}

+ (void)invokeDelegate:(id)delegate
              selector:(SEL)sel
                object:(id)obj1
                object:(id)obj2
                object:(id)obj3 {
  if (delegate && sel) {
    NSMethodSignature *sig = [delegate methodSignatureForSelector:sel];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
    [invocation setSelector:sel];
    [invocation setTarget:delegate];
    [invocation setArgument:&obj1 atIndex:2];
    [invocation setArgument:&obj2 atIndex:3];
    [invocation setArgument:&obj3 atIndex:4];
    [invocation invoke];
  }
}

+ (NSString *)unencodedOAuthParameterForString:(NSString *)str {
#if (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_9) && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_9) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_7_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0)
  // On iOS 7, -stringByRemovingPercentEncoding incorrectly returns nil for an empty string.
  if (str != nil && [str length] == 0) return @"";

  NSString *plainStr = [str stringByRemovingPercentEncoding];
  return plainStr;
#else
  NSString *plainStr = [str stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
  return plainStr;
#endif
}

+ (NSDictionary *)dictionaryWithResponseString:(NSString *)responseStr {
  // Build a dictionary from a response string of the form
  // "cat=fluffy&dog=spot".  Missing or empty values are considered
  // empty strings; keys and values are percent-decoded.
  if (responseStr == nil) return nil;

  NSArray *items = [responseStr componentsSeparatedByString:@"&"];

  NSMutableDictionary *responseDict = [NSMutableDictionary dictionaryWithCapacity:[items count]];

  for (NSString *item in items) {
    NSString *key = nil;
    NSString *value = @"";

    NSRange equalsRange = [item rangeOfString:@"="];
    if (equalsRange.location != NSNotFound) {
      // The parameter has at least one '='
      key = [item substringToIndex:equalsRange.location];

      // There are characters after the '='
      value = [item substringFromIndex:(equalsRange.location + 1)];
    } else {
      // The parameter has no '='
      key = item;
    }

    NSString *plainKey = [[self class] unencodedOAuthParameterForString:key];
    NSString *plainValue = [[self class] unencodedOAuthParameterForString:value];

    [responseDict setObject:plainValue forKey:plainKey];
  }

  return responseDict;
}

+ (NSDictionary *)dictionaryWithResponseData:(NSData *)data {
  NSString *responseStr = [[[NSString alloc] initWithData:data
                                                 encoding:NSUTF8StringEncoding] autorelease];
  NSDictionary *dict = [self dictionaryWithResponseString:responseStr];
  return dict;
}

+ (NSString *)scopeWithStrings:(NSString *)str, ... {
  // concatenate the strings, joined by a single space
  NSString *result = @"";
  NSString *joiner = @"";
  if (str) {
    va_list argList;
    va_start(argList, str);
    while (str) {
      result = [result stringByAppendingFormat:@"%@%@", joiner, str];
      joiner = @" ";
      str = va_arg(argList, id);
    }
    va_end(argList);
  }
  return result;
}

@end

#endif // GTM_INCLUDE_OAUTH2 || !GDATA_REQUIRE_SERVICE_INCLUDES
