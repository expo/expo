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

#import "FBSDKLoginCompletion+Internal.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLoginConstants.h"
#import "FBSDKLoginError.h"
#import "FBSDKLoginManager+Internal.h"
#import "FBSDKLoginUtility.h"

static void FBSDKLoginRequestMeAndPermissions(FBSDKLoginCompletionParameters *parameters, void(^completionBlock)(void))
{
  __block NSUInteger pendingCount = 1;
  void(^didCompleteBlock)(void) = ^{
    if (--pendingCount == 0) {
      completionBlock();
    }
  };

  NSString *tokenString = parameters.accessTokenString;
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];

  pendingCount++;
  FBSDKGraphRequest *userIDRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me"
                                                                       parameters:@{ @"fields" : @"id" }
                                                                      tokenString:tokenString
                                                                       HTTPMethod:nil
                                                                            flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:userIDRequest completionHandler:^(FBSDKGraphRequestConnection *requestConnection,
                                                           id result,
                                                           NSError *error) {
    parameters.userID = [result objectForKey:@"id"];
    if (error) {
      parameters.error = error;
    }
    didCompleteBlock();
  }];

  pendingCount++;
  FBSDKGraphRequest *permissionsRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/permissions"
                                                                            parameters:@{@"fields":@""}
                                                                           tokenString:tokenString
                                                                            HTTPMethod:nil
                                                                                 flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:permissionsRequest completionHandler:^(FBSDKGraphRequestConnection *requestConnection,
                                                                id result,
                                                                NSError *error) {
    NSMutableSet *grantedPermissions = [NSMutableSet set];
    NSMutableSet *declinedPermissions = [NSMutableSet set];

    [FBSDKInternalUtility extractPermissionsFromResponse:result
                                      grantedPermissions:grantedPermissions
                                     declinedPermissions:declinedPermissions];

    parameters.permissions = [grantedPermissions copy];
    parameters.declinedPermissions = [declinedPermissions copy];
    if (error) {
      parameters.error = error;
    }
    didCompleteBlock();
  }];

  [connection start];
  didCompleteBlock();
}

@implementation FBSDKLoginCompletionParameters

- (instancetype)init
{
  return [super init];
}

- (instancetype)initWithError:(NSError *)error
{
  if ((self = [self init]) != nil) {
    self.error = error;
  }
  return self;
}

@end

#pragma mark - Completers

@implementation FBSDKLoginURLCompleter
{
  FBSDKLoginCompletionParameters *_parameters;
  id<NSObject> _observer
  ;  BOOL _performExplicitFallback;
}

- (instancetype)initWithURLParameters:(NSDictionary *)parameters appID:(NSString *)appID
{
  if ((self = [super init]) != nil) {
    _parameters = [[FBSDKLoginCompletionParameters alloc] init];

    _parameters.accessTokenString = parameters[@"access_token"];

    if (_parameters.accessTokenString.length > 0) {
      [self setParametersWithDictionary:parameters appID:appID];
    } else {
      _parameters.accessTokenString = nil;
      [self setErrorWithDictionary:parameters];
    }
  }
  return self;
}

- (void)completeLogIn:(FBSDKLoginManager *)loginManager withHandler:(void(^)(FBSDKLoginCompletionParameters *parameters))handler
{
  if (_performExplicitFallback && loginManager.loginBehavior == FBSDKLoginBehaviorNative) {
    // UIKit and iOS don't like an application opening a URL during a URL open callback, so
    // we need to wait until *at least* the next turn of the run loop to open the URL to
    // perform the browser log in behavior. However we also need to wait for the application
    // to become active so FBSDKApplicationDelegate doesn't erroneously call back the URL
    // opener before the URL has been opened.
    if ([FBSDKApplicationDelegate sharedInstance].isActive) {
      // The application is active so there's no need to wait.
      [loginManager logInWithBehavior:FBSDKLoginBehaviorBrowser];
    } else {
      // use the block version to guarantee there's a strong reference to self
      _observer = [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:[NSOperationQueue mainQueue] usingBlock:^ (NSNotification *notification) {
        [self attemptBrowserLogIn:loginManager];
      }];
    }
    return;
  }

  if (_parameters.accessTokenString && !_parameters.userID) {
    void(^handlerCopy)(FBSDKLoginCompletionParameters *) = [handler copy];
    FBSDKLoginRequestMeAndPermissions(_parameters, ^{
      handlerCopy(self->_parameters);
    });
    return;
  }

  handler(_parameters);
}

- (void)setParametersWithDictionary:(NSDictionary *)parameters appID:(NSString *)appID
{
  NSString *grantedPermissionsString = parameters[@"granted_scopes"];
  NSString *declinedPermissionsString = parameters[@"denied_scopes"];

  NSString *signedRequest = parameters[@"signed_request"];
  NSString *userID = parameters[@"user_id"];

  // check the string length so that we assign an empty set rather than a set with an empty string
  _parameters.permissions = (grantedPermissionsString.length > 0)
  ? [NSSet setWithArray:[grantedPermissionsString componentsSeparatedByString:@","]]
  : [NSSet set];
  _parameters.declinedPermissions = (declinedPermissionsString.length > 0)
  ? [NSSet setWithArray:[declinedPermissionsString componentsSeparatedByString:@","]]
  : [NSSet set];

  _parameters.appID = appID;

  if (userID.length == 0 && signedRequest.length > 0) {
    _parameters.userID = [FBSDKLoginUtility userIDFromSignedRequest:signedRequest];
  } else {
    _parameters.userID = userID;
  }

  NSString *expirationDateString = parameters[@"expires"] ?: parameters[@"expires_at"];
  NSDate *expirationDate = [NSDate distantFuture];
  if (expirationDateString && [expirationDateString doubleValue] > 0) {
    expirationDate = [NSDate dateWithTimeIntervalSince1970:[expirationDateString doubleValue]];
  } else if (parameters[@"expires_in"] && [parameters[@"expires_in"] integerValue] > 0) {
    expirationDate = [NSDate dateWithTimeIntervalSinceNow:[parameters[@"expires_in"] integerValue]];
  }
  _parameters.expirationDate = expirationDate;

  NSDate *dataAccessExpirationDate = [NSDate distantFuture];
  if (parameters[@"data_access_expiration_time"] && [parameters[@"data_access_expiration_time"] integerValue] > 0) {
    dataAccessExpirationDate = [NSDate dateWithTimeIntervalSince1970:[parameters[@"data_access_expiration_time"] integerValue]];
  }
  _parameters.dataAccessExpirationDate = dataAccessExpirationDate;

  NSError *error = nil;
  NSDictionary *state = [FBSDKInternalUtility objectForJSONString:parameters[@"state"] error:&error];
  _parameters.challenge = [FBSDKUtility URLDecode:state[@"challenge"]];
}

- (void)setErrorWithDictionary:(NSDictionary *)parameters
{
  NSString *legacyErrorReason = parameters[@"error"];

  if ([legacyErrorReason isEqualToString:@"service_disabled_use_browser"] ||
      [legacyErrorReason isEqualToString:@"service_disabled"]) {
    _performExplicitFallback = YES;
  }

  // if error is nil, then this should be processed as a cancellation unless
  // _performExplicitFallback is set to YES and the log in behavior is Native.
  _parameters.error = [NSError fbErrorFromReturnURLParameters:parameters];
}

- (void)attemptBrowserLogIn:(FBSDKLoginManager *)loginManager {
  if (_observer != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_observer];
    _observer = nil;
  }

  if ([FBSDKApplicationDelegate sharedInstance].isActive) {
    [loginManager logInWithBehavior:FBSDKLoginBehaviorBrowser];
  } else {
    // The application is active but due to notification ordering the FBSDKApplicationDelegate
    // doesn't know it yet. Wait one more turn of the run loop.
    dispatch_async(dispatch_get_main_queue(), ^{
      [self attemptBrowserLogIn:loginManager];
    });
  }
}

@end

@implementation FBSDKLoginSystemAccountCompleter
{
  FBSDKLoginCompletionParameters *_parameters;
}

- (instancetype)initWithTokenString:(NSString *)tokenString appID:(NSString *)appID
{
  if ((self = [super init]) != nil) {
    _parameters = [[FBSDKLoginCompletionParameters alloc] init];

    _parameters.accessTokenString = tokenString;
    _parameters.appID = appID;

    _parameters.systemAccount = YES;
  }
  return self;
}

- (void)completeLogIn:(FBSDKLoginManager *)loginManager withHandler:(void(^)(FBSDKLoginCompletionParameters *parameters))handler
{
  void(^handlerCopy)(FBSDKLoginCompletionParameters *) = [handler copy];
  FBSDKLoginRequestMeAndPermissions(_parameters, ^{
    // Transform the FBSDKCoreKit error in to an FBSDKLoginKit error, if necessary. This specializes
    // the graph errors in to User Checkpointed, Password Changed or Unconfirmed User.
    //
    // It's possible the graph error has a value set for NSRecoveryAttempterErrorKey but we don't
    // have any login-specific attempter to provide since system auth succeeded and the error is a
    // graph API error.
    NSError *serverError = self->_parameters.error;
    NSError *error = [NSError fbErrorFromServerError:serverError];
    if (error != nil) {
      // In the event the user's password changed the Accounts framework will still return
      // an access token but API calls will fail. Clear the access token from the result
      // and use the special-case System Password changed error, which has different text
      // to display to the user.
      if (error.code == FBSDKLoginErrorPasswordChanged) {
        [FBSDKSystemAccountStoreAdapter sharedInstance].forceBlockingRenew = YES;

        self->_parameters.accessTokenString = nil;
        self->_parameters.appID = nil;

        error = [NSError fbErrorForSystemPasswordChange:serverError];
      }

      self->_parameters.error = error;
    }

    handlerCopy(self->_parameters);
  });
}

@end

@implementation FBSDKLoginSystemAccountErrorCompleter
{
  FBSDKLoginCompletionParameters *_parameters;
}

- (instancetype)initWithError:(NSError *)accountStoreError permissions:(NSSet *)permissions
{
  if ((self = [super init]) != nil) {
    _parameters = [[FBSDKLoginCompletionParameters alloc] init];

    NSError *error = [NSError fbErrorForSystemAccountStoreError:accountStoreError];
    if (error != nil) {
      _parameters.error = error;
    } else {
      // The lack of an error indicates the user declined permissions
      _parameters.declinedPermissions = permissions;
    }

    _parameters.systemAccount = YES;
  }
  return self;
}

- (void)completeLogIn:(FBSDKLoginManager *)loginManager withHandler:(void(^)(FBSDKLoginCompletionParameters *parameters))handler
{
  handler(_parameters);
}

@end
