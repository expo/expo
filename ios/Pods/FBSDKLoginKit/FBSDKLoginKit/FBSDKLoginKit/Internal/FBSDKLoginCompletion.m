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

#import <FBSDKCoreKit/FBSDKConstants.h>

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
    parameters.userID = result[@"id"];
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
    NSMutableSet *expiredPermissions = [NSMutableSet set];

    [FBSDKInternalUtility extractPermissionsFromResponse:result
                                      grantedPermissions:grantedPermissions
                                     declinedPermissions:declinedPermissions
                                      expiredPermissions:expiredPermissions];

    parameters.permissions = [grantedPermissions copy];
    parameters.declinedPermissions = [declinedPermissions copy];
    parameters.expiredPermissions = [expiredPermissions copy];
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
  id<NSObject> _observer;
  BOOL _performExplicitFallback;
}

- (instancetype)initWithURLParameters:(NSDictionary *)parameters appID:(NSString *)appID
{
  if ((self = [super init]) != nil) {
    _parameters = [[FBSDKLoginCompletionParameters alloc] init];

    _parameters.accessTokenString = parameters[@"access_token"];
    _parameters.nonceString = parameters[@"nonce"];

    if (_parameters.accessTokenString.length > 0 || _parameters.nonceString.length > 0) {
      [self setParametersWithDictionary:parameters appID:appID];
    } else {
      _parameters.accessTokenString = nil;
      [self setErrorWithDictionary:parameters];
    }
  }
  return self;
}

- (void)completeLoginWithHandler:(FBSDKLoginCompletionParametersBlock)handler
{
  if (_parameters.nonceString) {
    [self _exchangeNonceForTokenWithHandler:handler];
    return;
  } else if (_parameters.accessTokenString && !_parameters.userID) {
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

  _parameters.expiredPermissions = [NSSet set];

  _parameters.appID = appID;

  if (userID.length == 0 && signedRequest.length > 0) {
    _parameters.userID = [FBSDKLoginUtility userIDFromSignedRequest:signedRequest];
  } else {
    _parameters.userID = userID;
  }

  NSString *expirationDateString = parameters[@"expires"] ?: parameters[@"expires_at"];
  NSDate *expirationDate = [NSDate distantFuture];
  if (expirationDateString && expirationDateString.doubleValue > 0) {
    expirationDate = [NSDate dateWithTimeIntervalSince1970:expirationDateString.doubleValue];
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
  NSDictionary<id, id> *state = [FBSDKBasicUtility objectForJSONString:parameters[@"state"] error:&error];
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

  if ([FBSDKBridgeAPI sharedInstance].isActive) {
    [loginManager logInWithBehavior:FBSDKLoginBehaviorBrowser];
  } else {
    // The application is active but due to notification ordering the FBSDKApplicationDelegate
    // doesn't know it yet. Wait one more turn of the run loop.
    dispatch_async(dispatch_get_main_queue(), ^{
      [self attemptBrowserLogIn:loginManager];
    });
  }
}

- (void)_exchangeNonceForTokenWithHandler:(FBSDKLoginCompletionParametersBlock)handler
{
  if (!handler) {
      return;
  }

  NSString *nonce = _parameters.nonceString ?: @"";
  NSString *appID = [FBSDKSettings appID] ?: @"";

  if (nonce.length == 0 || appID.length == 0) {
    _parameters.error = [FBSDKError errorWithCode:FBSDKErrorInvalidArgument message:@"Missing required parameters to exchange nonce for access token."];

    handler(_parameters);
    return;
  }

  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  FBSDKGraphRequest *tokenRequest = [[FBSDKGraphRequest alloc]
                                     initWithGraphPath:@"oauth/access_token"
                                     parameters:@{ @"grant_type" : @"fb_exchange_nonce",
                                                   @"fb_exchange_nonce" : nonce,
                                                   @"client_id" : appID,
                                                   @"fields" : @"" }
                                     flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError |
                                     FBSDKGraphRequestFlagDisableErrorRecovery];
  __block FBSDKLoginCompletionParameters *parameters = _parameters;
  [connection addRequest:tokenRequest completionHandler:^(FBSDKGraphRequestConnection *requestConnection,
                                                          id result,
                                                          NSError *error) {
    if (!error) {
      parameters.accessTokenString = result[@"access_token"];
      NSDate *expirationDate = [NSDate distantFuture];
      if (result[@"expires_in"] && [result[@"expires_in"] integerValue] > 0) {
        expirationDate = [NSDate dateWithTimeIntervalSinceNow:[result[@"expires_in"] integerValue]];
      }
      parameters.expirationDate = expirationDate;

      NSDate *dataAccessExpirationDate = [NSDate distantFuture];
      if (result[@"data_access_expiration_time"] && [result[@"data_access_expiration_time"] integerValue] > 0) {
        dataAccessExpirationDate = [NSDate dateWithTimeIntervalSince1970:[result[@"data_access_expiration_time"] integerValue]];
      }
      parameters.dataAccessExpirationDate = dataAccessExpirationDate;
    } else {
      parameters.error = error;
    }

    handler(parameters);
  }];

  [connection start];
}

@end
