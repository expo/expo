/*! @file GTMAppAuthFetcherAuthorization.m
    @brief GTMAppAuth SDK
    @copyright
        Copyright 2016 Google Inc.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "GTMAppAuthFetcherAuthorization.h"

#if SWIFT_PACKAGE || GTMAPPAUTH_USE_MODULAR_IMPORT
@import AppAuthCore;
#elif GTMAPPAUTH_USER_IMPORTS
#import "AppAuthCore.h"
#else
#import <AppAuth/AppAuthCore.h>
#endif

#define GTMOAuth2AssertValidSelector GTMBridgeAssertValidSelector

/*! @brief Provides a template implementation for init-family methods which have been marked as
        NS_UNAVILABLE. Stops the compiler from giving a warning when it's the super class'
        designated initializer, and gives callers useful feedback telling them what the
        new designated initializer is.
    @remarks Takes a SEL as a parameter instead of a string so that we get compiler warnings if the
        designated initializer's signature changes.
    @param designatedInitializer A SEL referencing the designated initializer.
 */
#define GTM_UNAVAILABLE_USE_INITIALIZER(designatedInitializer) { \
  NSString *reason = [NSString stringWithFormat:@"Called: %@\nDesignated Initializer:%@", \
                                                NSStringFromSelector(_cmd), \
                                                NSStringFromSelector(designatedInitializer)]; \
  @throw [NSException exceptionWithName:@"Attempt to call unavailable initializer." \
                                 reason:reason \
                               userInfo:nil]; \
}

/*! @brief Key used to encode the @c authState property for @c NSSecureCoding.
 */
static NSString *const kAuthStateKey = @"authState";

/*! @brief Key used to encode the @c serviceProvider property for @c NSSecureCoding.
 */
static NSString *const kServiceProviderKey = @"serviceProvider";

/*! @brief Key used to encode the @c userID property for @c NSSecureCoding.
 */
static NSString *const kUserIDKey = @"userID";

/*! @brief Key used to encode the @c userEmail property for @c NSSecureCoding.
 */
static NSString *const kUserEmailKey = @"userEmail";

/*! @brief Key used to encode the @c userEmailIsVerified property for @c NSSecureCoding.
 */
static NSString *const kUserEmailIsVerifiedKey = @"userEmailIsVerified";

NSString *const GTMAppAuthFetcherAuthorizationErrorDomain =
    @"kGTMAppAuthFetcherAuthorizationErrorDomain";
NSString *const GTMAppAuthFetcherAuthorizationErrorRequestKey = @"request";

/*! @brief Internal wrapper class for requests needing authorization and their callbacks.
    @discusssion Used to abstract away the detail of whether a callback or block is used.
 */
@interface GTMAppAuthFetcherAuthorizationArgs : NSObject

/*! @brief The request to authorize.
 *  @discussion Not copied, as we are mutating the request.
 */
@property (nonatomic, strong) NSMutableURLRequest *request;

/*! @brief The delegate on which @c selector is called on completion.
 */
@property (nonatomic, weak) id delegate;

/*! @brief The selector called on the @c delegate object on completion.
 */
@property (nonatomic) SEL selector;

/*! @brief The completion block when the block option was used.
 */
@property (nonatomic, strong) GTMAppAuthFetcherAuthorizationCompletion completionHandler;

/*! @brief The error that happened during token refresh (if any).
 */
@property (nonatomic, strong) NSError *error;

+ (GTMAppAuthFetcherAuthorizationArgs *)argsWithRequest:(NSMutableURLRequest *)req
             delegate:(id)delegate
             selector:(SEL)selector
    completionHandler:(GTMAppAuthFetcherAuthorizationCompletion)completionHandler;

@end

@implementation GTMAppAuthFetcherAuthorizationArgs

@synthesize request = _request;
@synthesize delegate = _delegate;
@synthesize selector = _selector;
@synthesize completionHandler = _completionHandler;
@synthesize error = _error;

+ (GTMAppAuthFetcherAuthorizationArgs *)argsWithRequest:(NSMutableURLRequest *)req
             delegate:(id)delegate
             selector:(SEL)selector
    completionHandler:(GTMAppAuthFetcherAuthorizationCompletion)completionHandler {
  GTMAppAuthFetcherAuthorizationArgs *obj;
  obj = [[GTMAppAuthFetcherAuthorizationArgs alloc] init];
  obj.request = req;
  obj.delegate = delegate;
  obj.selector = selector;
  obj.completionHandler = completionHandler;
  return obj;
}

@end

@implementation GTMAppAuthFetcherAuthorization {
  /*! @brief Array of requests pending authorization headers.
   */
  NSMutableArray<GTMAppAuthFetcherAuthorizationArgs *> *_authorizationQueue;
}

@synthesize authState = _authState;
@synthesize serviceProvider = _serviceProvider;
@synthesize userID = _userID;
@synthesize userEmailIsVerified = _userEmailIsVerified;

// GTMFetcherAuthorizationProtocol doesn't specify atomic/nonatomic for these properties.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wimplicit-atomic-properties"
@synthesize userEmail = _userEmail;
@synthesize shouldAuthorizeAllRequests = _shouldAuthorizeAllRequests;
@synthesize fetcherService = _fetcherService;
#pragma clang diagnostic pop

#pragma mark - Initializers

// Ignore warning about not calling the designated initializer.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"
- (instancetype)init
    GTM_UNAVAILABLE_USE_INITIALIZER(@selector(initWithAuthState:));
#pragma clang diagnostic pop

- (instancetype)initWithAuthState:(OIDAuthState *)authState {
  return [self initWithAuthState:authState
                 serviceProvider:nil
                          userID:nil
                       userEmail:nil
             userEmailIsVerified:nil];
}

- (instancetype)initWithAuthState:(OIDAuthState *)authState
                           serviceProvider:(nullable NSString *)serviceProvider
                                    userID:(nullable NSString *)userID
                                 userEmail:(nullable NSString *)userEmail
                       userEmailIsVerified:(nullable NSString *)userEmailIsVerified {
  self = [super init];
  if (self) {
    _authState = authState;
    _authorizationQueue = [[NSMutableArray alloc] init];

    _serviceProvider = [serviceProvider copy];
    _userID = [userID copy];
    _userEmail = [userEmail copy];
    _userEmailIsVerified = [userEmailIsVerified copy];

    // Decodes the ID Token locally to extract the email address.
    NSString *idToken = _authState.lastTokenResponse.idToken
        ? : _authState.lastAuthorizationResponse.idToken;
    if (idToken) {
      NSDictionary *claimsDictionary = [[OIDIDToken alloc] initWithIDTokenString:idToken].claims;
      if (claimsDictionary) {
        _userEmail = (NSString *)[claimsDictionary[@"email"] copy];
        _userEmailIsVerified = [(NSNumber *)claimsDictionary[@"email_verified"] stringValue];
        _userID = [claimsDictionary[@"sub"] copy];
      }
    }
  }
  return self;
}

# pragma mark - Convenience

#if !GTM_APPAUTH_SKIP_GOOGLE_SUPPORT
+ (OIDServiceConfiguration *)configurationForGoogle {
  NSURL *authorizationEndpoint =
      [NSURL URLWithString:@"https://accounts.google.com/o/oauth2/v2/auth"];
  NSURL *tokenEndpoint =
      [NSURL URLWithString:@"https://www.googleapis.com/oauth2/v4/token"];

  OIDServiceConfiguration *configuration =
      [[OIDServiceConfiguration alloc] initWithAuthorizationEndpoint:authorizationEndpoint
                                                       tokenEndpoint:tokenEndpoint];
  return configuration;
}
#endif // !GTM_APPAUTH_SKIP_GOOGLE_SUPPORT

#pragma mark - Authorizing Requests

/*! @brief Internal routine common to delegate and block invocations to queue requests while
        fresh tokens are obtained.
 */
- (void)authorizeRequestArgs:(GTMAppAuthFetcherAuthorizationArgs *)args {
  // Adds requests to queue.
  @synchronized(_authorizationQueue) {
    [_authorizationQueue addObject:args];
  }

  NSDictionary<NSString *, NSString *> *additionalRefreshParameters = _tokenRefreshDelegate ?
      [_tokenRefreshDelegate additionalRefreshParameters:self] : nil;

  // Obtains fresh tokens from AppAuth.
  [_authState performActionWithFreshTokens:^(NSString *_Nullable accessToken,
                                             NSString *_Nullable idToken,
                                             NSError *_Nullable error) {
    // Processes queue.
    @synchronized(self->_authorizationQueue) {
      for (GTMAppAuthFetcherAuthorizationArgs *fetcherArgs in self->_authorizationQueue) {
        [self authorizeRequestImmediateArgs:fetcherArgs accessToken:accessToken error:error];
      }
      [self->_authorizationQueue removeAllObjects];
    }
  }
               additionalRefreshParameters:additionalRefreshParameters];
}

/*! @brief Adds authorization headers to the given request, using the supplied access token, or
        handles the error.
    @param args The request argument group to authorize.
    @param accessToken A currently valid access token.
    @param error If accessToken is nil, the error which caused the token to be unavailable.
    @return YES if the request was authorized with a valid access token.
 */
- (BOOL)authorizeRequestImmediateArgs:(GTMAppAuthFetcherAuthorizationArgs *)args
                          accessToken:(NSString *)accessToken
                                error:(NSError *)error {
  // This authorization entry point never attempts to refresh the access token,
  // but does call the completion routine

  NSMutableURLRequest *request = args.request;

  NSURL *requestURL = [request URL];
  NSString *scheme = [requestURL scheme];
  BOOL isAuthorizableRequest =
      !requestURL
      || (scheme && [scheme caseInsensitiveCompare:@"https"] == NSOrderedSame)
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
  if (isAuthorizableRequest && accessToken && accessToken.length > 0) {
    if (request) {
      // Adds the authorization header to the request.
      NSString *value = [NSString stringWithFormat:@"%@ %@", @"Bearer", accessToken];
      [request setValue:value forHTTPHeaderField:@"Authorization"];
    }

    // We've authorized the request, even if the previous refresh
    // failed with an error
    args.error = nil;
  } else {
    NSMutableDictionary *userInfo = [error.userInfo mutableCopy];
    if (!userInfo) {
      userInfo = [[NSMutableDictionary alloc] init];
    }
    if (request) {
      userInfo[GTMAppAuthFetcherAuthorizationErrorRequestKey] = request;
    }

    if (!isAuthorizableRequest || !error) {
      args.error = [NSError errorWithDomain:GTMAppAuthFetcherAuthorizationErrorDomain
                                       code:GTMAppAuthFetcherAuthorizationErrorUnauthorizableRequest
                                   userInfo:userInfo];
    } else {
      // Passes through error domain & code from AppAuth, with additional userInfo args.
      args.error = [NSError errorWithDomain:error.domain
                                       code:error.code
                                   userInfo:userInfo];
    }
  }

  // Invoke any callbacks on the proper thread
  if (args.delegate || args.completionHandler) {
    // If the fetcher service provides a callback queue, we'll use that
    // (or if it's nil, we'll use the main thread) for callbacks.
    dispatch_queue_t callbackQueue = self.fetcherService.callbackQueue;
    if (!callbackQueue) {
      callbackQueue = dispatch_get_main_queue();
    }
    dispatch_async(callbackQueue, ^{
      [self invokeCallbackArgs:args];
    });
  }

  BOOL didAuth = (args.error == nil);
  return didAuth;
}

/*! @brief Invokes the callback for the given authorization argument group.
    @param args The request argument group to invoke following authorization or error.
 */
- (void)invokeCallbackArgs:(GTMAppAuthFetcherAuthorizationArgs *)args {
  NSError *error = args.error;
  id delegate = args.delegate;
  SEL sel = args.selector;

  // If the selector callback method exists, invokes the selector.
  if (delegate && sel) {
    NSMutableURLRequest *request = args.request;

    NSMethodSignature *sig = [delegate methodSignatureForSelector:sel];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
    [invocation setSelector:sel];
    [invocation setTarget:delegate];
    GTMAppAuthFetcherAuthorization *authorization = self;
    [invocation setArgument:&authorization atIndex:2];
    [invocation setArgument:&request atIndex:3];
    [invocation setArgument:&error atIndex:4];
    [invocation invoke];
  }

  // If a callback block exists, executes the block.
  id handler = args.completionHandler;
  if (handler) {
    void (^authCompletionBlock)(NSError *) = handler;
    authCompletionBlock(error);
  }
}

#pragma mark - GTMFetcherAuthorizationProtocol

/*! @brief Authorizing with a callback selector.
    @discussion Selector has the signature:
        - (void)authentication:(GTMAppAuthFetcherAuthorization *)auth
                       request:(NSMutableURLRequest *)request
             finishedWithError:(NSError *)error;
 */
- (void)authorizeRequest:(NSMutableURLRequest *)request
                delegate:(id)delegate
       didFinishSelector:(SEL)sel {
  GTMOAuth2AssertValidSelector(delegate, sel,
                               @encode(GTMAppAuthFetcherAuthorization *),
                               @encode(NSMutableURLRequest *),
                               @encode(NSError *), 0);

  GTMAppAuthFetcherAuthorizationArgs *args;
  args = [GTMAppAuthFetcherAuthorizationArgs argsWithRequest:request
                                                    delegate:delegate
                                                    selector:sel
                                           completionHandler:nil];
  [self authorizeRequestArgs:args];
}

/*! @brief Removes all pending requests from the authorization queue.
 */
- (void)stopAuthorization {
  @synchronized(_authorizationQueue) {
    [_authorizationQueue removeAllObjects];
  }
}

/*! @brief Attempts to remove a specific pending requests from the authorization queue.
    @discussion Has no effect if the authorization already occurred.
 */
- (void)stopAuthorizationForRequest:(NSURLRequest *)request {
  @synchronized(_authorizationQueue) {
    NSUInteger argIndex = 0;
    BOOL found = NO;
    for (GTMAppAuthFetcherAuthorizationArgs *args in _authorizationQueue) {
      // Checks pointer equality with given request, don't want to match equivalent requests.
      if ([args request] == request) {
        found = YES;
        break;
      }
      argIndex++;
    }

    if (found) {
      [_authorizationQueue removeObjectAtIndex:argIndex];

      // If the queue is now empty, go ahead and stop the fetcher.
      if (_authorizationQueue.count == 0) {
        [self stopAuthorization];
      }
    }
  }
}

/*! @brief Returns YES if the given requests is in the pending authorization queue.
 */
- (BOOL)isAuthorizingRequest:(NSURLRequest *)request {
  BOOL wasFound = NO;
  @synchronized(_authorizationQueue) {
    for (GTMAppAuthFetcherAuthorizationArgs *args in _authorizationQueue) {
      // Checks pointer equality with given request, don't want to match equivalent requests.
      if ([args request] == request) {
        wasFound = YES;
        break;
      }
    }
  }
  return wasFound;
}

/*! @brief Returns YES if given request has an Authorization header.
 */
- (BOOL)isAuthorizedRequest:(NSURLRequest *)request {
  NSString *authStr = [request valueForHTTPHeaderField:@"Authorization"];
  return (authStr.length > 0);
}

/*! @brief Returns YES if the authorization state is currently valid.
    @discussion Note that the state can become invalid immediately due to an error on token refresh.
 */
- (BOOL)canAuthorize {
  return [_authState isAuthorized];
}

/*! @brief Authorizing with a completion block.
 */
- (void)authorizeRequest:(NSMutableURLRequest *)request
       completionHandler:(GTMAppAuthFetcherAuthorizationCompletion)handler {
  GTMAppAuthFetcherAuthorizationArgs *args =
  [GTMAppAuthFetcherAuthorizationArgs argsWithRequest:request
                                             delegate:nil
                                             selector:NULL
                                    completionHandler:handler];
  [self authorizeRequestArgs:args];
}

/*! @brief Forces a token refresh the next time a request is queued for authorization.
 */
- (BOOL)primeForRefresh {
  if (_authState.refreshToken == nil) {
    // Cannot refresh without a refresh token
    return NO;
  }
  [_authState setNeedsTokenRefresh];
  return YES;
}

#pragma mark - NSSecureCoding

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (nullable instancetype)initWithCoder:(NSCoder *)aDecoder {
  OIDAuthState *authState =
      [aDecoder decodeObjectOfClass:[OIDAuthState class] forKey:kAuthStateKey];
  NSString *serviceProvider =
      [aDecoder decodeObjectOfClass:[NSString class] forKey:kServiceProviderKey];
  NSString *userID = [aDecoder decodeObjectOfClass:[NSString class] forKey:kUserIDKey];
  NSString *userEmail = [aDecoder decodeObjectOfClass:[NSString class] forKey:kUserEmailKey];
  NSString *userEmailIsVerified =
      [aDecoder decodeObjectOfClass:[NSString class] forKey:kUserEmailIsVerifiedKey];

  self = [self initWithAuthState:authState
                 serviceProvider:serviceProvider
                           userID:userID
                        userEmail:userEmail
              userEmailIsVerified:userEmailIsVerified];
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_authState forKey:kAuthStateKey];
  [aCoder encodeObject:_serviceProvider forKey:kServiceProviderKey];
  [aCoder encodeObject:_userID forKey:kUserIDKey];
  [aCoder encodeObject:_userEmail forKey:kUserEmailKey];
  [aCoder encodeObject:_userEmailIsVerified forKey:kUserEmailIsVerifiedKey];
}

@end
