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

#import "FBSDKLoginManager+Internal.h"
#import "FBSDKLoginManagerLoginResult+Internal.h"

#import <FBSDKCoreKit/FBSDKAccessToken.h>
#import <FBSDKCoreKit/FBSDKSettings.h>

#import "_FBSDKLoginRecoveryAttempter.h"
#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLoginCompletion.h"
#import "FBSDKLoginConstants.h"
#import "FBSDKLoginError.h"
#import "FBSDKLoginManagerLogger.h"
#import "FBSDKLoginUtility.h"

static int const FBClientStateChallengeLength = 20;
static NSString *const FBSDKExpectedChallengeKey = @"expected_login_challenge";
static NSString *const FBSDKOauthPath = @"/dialog/oauth";
static NSString *const SFVCCanceledLogin = @"com.apple.SafariServices.Authentication";
static NSString *const ASCanceledLogin = @"com.apple.AuthenticationServices.WebAuthenticationSession";

// constants
FBSDKLoginAuthType FBSDKLoginAuthTypeRerequest = @"rerequest";
FBSDKLoginAuthType FBSDKLoginAuthTypeReauthorize = @"reauthorize";

typedef NS_ENUM(NSInteger, FBSDKLoginManagerState) {
  FBSDKLoginManagerStateIdle,
  // We received a call to start login.
  FBSDKLoginManagerStateStart,
  // We're calling out to the Facebook app or Safari to perform a log in
  FBSDKLoginManagerStatePerformingLogin,
};

@implementation FBSDKLoginManager
{
  FBSDKLoginManagerLoginResultBlock _handler;
  FBSDKLoginManagerLogger *_logger;
  FBSDKLoginManagerState _state;
  FBSDKKeychainStore *_keychainStore;
  BOOL _usedSFAuthSession;
}

+ (void)initialize
{
  if (self == [FBSDKLoginManager class]) {
    [_FBSDKLoginRecoveryAttempter class];
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    self.authType = FBSDKLoginAuthTypeRerequest;
    NSString *keyChainServiceIdentifier = [NSString stringWithFormat:@"com.facebook.sdk.loginmanager.%@", [NSBundle mainBundle].bundleIdentifier];
    _keychainStore = [[FBSDKKeychainStore alloc] initWithService:keyChainServiceIdentifier accessGroup:nil];
  }
  return self;
}

- (void)logInWithPermissions:(NSArray<NSString *> *)permissions
          fromViewController:(UIViewController *)fromViewController
                     handler:(FBSDKLoginManagerLoginResultBlock)handler
{
  if (![self validateLoginStartState]) {
    return;
  }
  self.fromViewController = fromViewController;
  NSSet<NSString *> *permissionSet = [NSSet setWithArray:permissions];
  [self logInWithPermissions:permissionSet handler:handler];
}

- (void)reauthorizeDataAccess:(UIViewController *)fromViewController handler:(FBSDKLoginManagerLoginResultBlock)handler
{
  if (![self validateLoginStartState]) {
    return;
  }
  self.fromViewController = fromViewController;
  [self reauthorizeDataAccess:handler];
}


- (void)logOut
{
  [FBSDKAccessToken setCurrentAccessToken:nil];
  [FBSDKProfile setCurrentProfile:nil];
}

#pragma mark - Private

- (void)raiseLoginException:(NSException *)exception
{
  _state = FBSDKLoginManagerStateIdle;
  [exception raise];
}

- (void)handleImplicitCancelOfLogIn
{
  FBSDKLoginManagerLoginResult *result = [[FBSDKLoginManagerLoginResult alloc] initWithToken:nil
                                                                                 isCancelled:YES
                                                                          grantedPermissions:NSSet.set
                                                                         declinedPermissions:NSSet.set];
  [result addLoggingExtra:@YES forKey:@"implicit_cancel"];
  [self invokeHandler:result error:nil];
}

- (BOOL)validateLoginStartState
{
  switch (_state) {
    case FBSDKLoginManagerStateStart: {
      if (self->_usedSFAuthSession) {
        // Using SFAuthenticationSession makes an interestitial dialog that blocks the app, but in certain situations such as
        // screen lock it can be dismissed and have the control returned to the app without invoking the completionHandler.
        // In this case, the viewcontroller has the control back and tried to reinvoke the login. This is acceptable behavior
        // and we should pop up the dialog again
        return YES;
      }

      NSString *errorStr = @"** WARNING: You are trying to start a login while a previous login has not finished yet."
      "This is unsupported behavior. You should wait until the previous login handler gets called to start a new login.";
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                         formatString:@"%@", errorStr];
      return NO;
    }
    case FBSDKLoginManagerStatePerformingLogin:{
      [self handleImplicitCancelOfLogIn];
      return YES;
    }
    case FBSDKLoginManagerStateIdle:
      _state = FBSDKLoginManagerStateStart;
      return YES;
  }
}

- (BOOL)isPerformingLogin
{
  return _state == FBSDKLoginManagerStatePerformingLogin;
}

- (void)assertPermissions:(NSArray *)permissions
{
  for (NSString *permission in permissions) {
    if (![permission isKindOfClass:[NSString class]]) {
      [self raiseLoginException:[NSException exceptionWithName:NSInvalidArgumentException
                                                         reason:@"Permissions must be string values."
                                                       userInfo:nil]];
    }
    if ([permission rangeOfString:@","].location != NSNotFound) {
      [self raiseLoginException:[NSException exceptionWithName:NSInvalidArgumentException
                                                        reason:@"Permissions should each be specified in separate string values in the array."
                                                      userInfo:nil]];
    }
  }
}

- (void)completeAuthentication:(FBSDKLoginCompletionParameters *)parameters expectChallenge:(BOOL)expectChallenge
{
  NSSet *recentlyGrantedPermissions = nil;
  NSSet *recentlyDeclinedPermissions = nil;
  FBSDKLoginManagerLoginResult *result = nil;
  NSError *error = parameters.error;

  NSString *tokenString = parameters.accessTokenString;
  BOOL cancelled = (tokenString == nil);

  BOOL challengePassed = YES;
  if (expectChallenge) {
    // Perform this check early so we be sure to clear expected challenge in all cases.
    NSString *challengeReceived = parameters.challenge;
    NSString *challengeExpected = [[self loadExpectedChallenge] stringByReplacingOccurrencesOfString:@"+" withString:@" "];
    if (![challengeExpected isEqualToString:challengeReceived]) {
      challengePassed = NO;
    }

    // Don't overwrite an existing error, if any.
    if (!error && !cancelled && !challengePassed) {
      error = [NSError fbErrorForFailedLoginWithCode:FBSDKLoginErrorBadChallengeString];
    }
  }

  [self storeExpectedChallenge:nil];

  if (!error) {
    if (!cancelled) {
      NSSet *grantedPermissions = parameters.permissions;
      NSSet *declinedPermissions = parameters.declinedPermissions;

      [self determineRecentlyGrantedPermissions:&recentlyGrantedPermissions
                    recentlyDeclinedPermissions:&recentlyDeclinedPermissions
                           forGrantedPermission:grantedPermissions
                            declinedPermissions:declinedPermissions];

      if (recentlyGrantedPermissions.count > 0) {
        FBSDKAccessToken *token = [[FBSDKAccessToken alloc] initWithTokenString:tokenString
                                                                    permissions:grantedPermissions.allObjects
                                                            declinedPermissions:declinedPermissions.allObjects
                                                             expiredPermissions:@[]
                                                                          appID:parameters.appID
                                                                         userID:parameters.userID
                                                                 expirationDate:parameters.expirationDate
                                                                    refreshDate:[NSDate date]
                                                                    dataAccessExpirationDate:parameters.dataAccessExpirationDate];
        result = [[FBSDKLoginManagerLoginResult alloc] initWithToken:token
                                                         isCancelled:NO
                                                  grantedPermissions:recentlyGrantedPermissions
                                                 declinedPermissions:recentlyDeclinedPermissions];

        if ([FBSDKAccessToken currentAccessToken]) {
          [self validateReauthentication:[FBSDKAccessToken currentAccessToken] withResult:result];
          // in a reauth, short circuit and let the login handler be called when the validation finishes.
          return;
        }
      }
    }

    if (cancelled || recentlyGrantedPermissions.count == 0) {
      NSSet *declinedPermissions = nil;
      if ([FBSDKAccessToken currentAccessToken] != nil) {
        // Always include the list of declined permissions from this login request
        // if an access token is already cached by the SDK
        declinedPermissions = recentlyDeclinedPermissions;
      }

      result = [[FBSDKLoginManagerLoginResult alloc] initWithToken:nil
                                                       isCancelled:cancelled
                                                grantedPermissions:NSSet.set
                                               declinedPermissions:declinedPermissions];
    }
  }

  if (result.token) {
    [FBSDKAccessToken setCurrentAccessToken:result.token];
  }

  [self invokeHandler:result error:error];
}

- (void)determineRecentlyGrantedPermissions:(NSSet **)recentlyGrantedPermissionsRef
                recentlyDeclinedPermissions:(NSSet **)recentlyDeclinedPermissionsRef
                       forGrantedPermission:(NSSet *)grantedPermissions
                        declinedPermissions:(NSSet *)declinedPermissions
{
  NSMutableSet *recentlyGrantedPermissions = [grantedPermissions mutableCopy];
  NSSet *previouslyGrantedPermissions = ([FBSDKAccessToken currentAccessToken] ?
                                         [FBSDKAccessToken currentAccessToken].permissions :
                                         nil);
  if (previouslyGrantedPermissions.count > 0) {
      // If there were no requested permissions for this auth - treat all permissions as granted.
      // Otherwise this is a reauth, so recentlyGranted should be a subset of what was requested.
      if (_requestedPermissions.count != 0) {
          [recentlyGrantedPermissions intersectSet:_requestedPermissions];
      }
  }

  NSMutableSet *recentlyDeclinedPermissions = [_requestedPermissions mutableCopy];
  [recentlyDeclinedPermissions intersectSet:declinedPermissions];

  if (recentlyGrantedPermissionsRef != NULL) {
    *recentlyGrantedPermissionsRef = [recentlyGrantedPermissions copy];
  }
  if (recentlyDeclinedPermissionsRef != NULL) {
    *recentlyDeclinedPermissionsRef = [recentlyDeclinedPermissions copy];
  }
}

- (void)invokeHandler:(FBSDKLoginManagerLoginResult *)result error:(NSError *)error
{
  [_logger endLoginWithResult:result error:error];
  [_logger endSession];
  _logger = nil;
  _state = FBSDKLoginManagerStateIdle;

  if (_handler) {
    FBSDKLoginManagerLoginResultBlock handler = _handler;
    _handler(result, error);
    if (handler == _handler) {
      _handler = nil;
    } else {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                         formatString:@"** WARNING: You are requesting permissions inside the completion block of an existing login."
       "This is unsupported behavior. You should request additional permissions only when they are needed, such as requesting for publish_actions"
       "when the user performs a sharing action."];
    }
  }
}

- (NSString *)loadExpectedChallenge
{
  return [_keychainStore stringForKey:FBSDKExpectedChallengeKey];
}

- (NSDictionary *)logInParametersWithPermissions:(NSSet *)permissions serverConfiguration:(FBSDKServerConfiguration *)serverConfiguration
{
  [FBSDKInternalUtility validateURLSchemes];

  NSMutableDictionary *loginParams = [NSMutableDictionary dictionary];
  loginParams[@"client_id"] = [FBSDKSettings appID];
  loginParams[@"response_type"] = @"token_or_nonce,signed_request";
  loginParams[@"redirect_uri"] = @"fbconnect://success";
  loginParams[@"display"] = @"touch";
  loginParams[@"sdk"] = @"ios";
  loginParams[@"return_scopes"] = @"true";
  loginParams[@"sdk_version"] = FBSDK_VERSION_STRING;
  loginParams[@"fbapp_pres"] = @([FBSDKInternalUtility isFacebookAppInstalled]);
  loginParams[@"auth_type"] = self.authType;
  loginParams[@"logging_token"] = serverConfiguration.loggingToken;

  [FBSDKBasicUtility dictionary:loginParams setObject:[FBSDKSettings appURLSchemeSuffix] forKey:@"local_client_id"];
  [FBSDKBasicUtility dictionary:loginParams setObject:[FBSDKLoginUtility stringForAudience:self.defaultAudience] forKey:@"default_audience"];
  [FBSDKBasicUtility dictionary:loginParams setObject:[permissions.allObjects componentsJoinedByString:@","] forKey:@"scope"];

  NSString *expectedChallenge = [FBSDKLoginManager stringForChallenge];
  NSDictionary *state = @{@"challenge": [FBSDKUtility URLEncode:expectedChallenge]};
  loginParams[@"state"] = [FBSDKBasicUtility JSONStringForObject:state error:NULL invalidObjectHandler:nil];

  [self storeExpectedChallenge:expectedChallenge];

  return loginParams;
}

- (void)logInWithPermissions:(NSSet *)permissions handler:(FBSDKLoginManagerLoginResultBlock)handler
{
  FBSDKServerConfiguration *serverConfiguration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  _logger = [[FBSDKLoginManagerLogger alloc] initWithLoggingToken:serverConfiguration.loggingToken];

  _handler = [handler copy];
  _requestedPermissions = permissions;

  [_logger startSessionForLoginManager:self];

  [self logInWithBehavior:self.loginBehavior];
}

- (void)reauthorizeDataAccess:(FBSDKLoginManagerLoginResultBlock)handler
{
  FBSDKServerConfiguration *serverConfiguration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  _logger = [[FBSDKLoginManagerLogger alloc] initWithLoggingToken:serverConfiguration.loggingToken];
  _handler = [handler copy];
  // Don't need to pass permissions for data reauthorization.
  _requestedPermissions = [NSSet set];
  self.authType = FBSDKLoginAuthTypeReauthorize;
  [_logger startSessionForLoginManager:self];
  [self logInWithBehavior:self.loginBehavior];
}

- (void)logInWithBehavior:(FBSDKLoginBehavior)loginBehavior
{
  FBSDKServerConfiguration *serverConfiguration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  NSDictionary *loginParams = [self logInParametersWithPermissions:_requestedPermissions serverConfiguration:serverConfiguration];
  self->_usedSFAuthSession = NO;

  void(^completion)(BOOL, NSString *, NSError *) = ^void(BOOL didPerformLogIn, NSString *authMethod, NSError *error) {
    if (didPerformLogIn) {
      [self->_logger startAuthMethod:authMethod];
      self->_state = FBSDKLoginManagerStatePerformingLogin;
    } else if ([error.domain isEqualToString:SFVCCanceledLogin] ||
               [error.domain isEqualToString:ASCanceledLogin]) {
      [self handleImplicitCancelOfLogIn];
    } else {
      if (!error) {
        error = [NSError errorWithDomain:FBSDKLoginErrorDomain code:FBSDKLoginErrorUnknown userInfo:nil];
      }
      [self invokeHandler:nil error:error];
    }
  };

  [self performBrowserLogInWithParameters:loginParams handler:^(BOOL openedURL,
                                                                NSString *authMethod,
                                                                NSError *openedURLError) {
    completion(openedURL, authMethod, openedURLError);
  }];
}

- (void)storeExpectedChallenge:(NSString *)challengeExpected
{
  [_keychainStore setString:challengeExpected
                     forKey:FBSDKExpectedChallengeKey
              accessibility:[FBSDKDynamicFrameworkLoader loadkSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]];
}

+ (NSString *)stringForChallenge {
  NSString *challenge = [FBSDKCrypto randomString:FBClientStateChallengeLength];

  return [challenge stringByReplacingOccurrencesOfString:@"+" withString:@"="];
}

- (void)validateReauthentication:(FBSDKAccessToken *)currentToken withResult:(FBSDKLoginManagerLoginResult *)loginResult
{
  FBSDKGraphRequest *requestMe = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me"
                                                                   parameters:@{@"fields":@""}
                                                                  tokenString:loginResult.token.tokenString
                                                                   HTTPMethod:nil
                                                                        flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
  [requestMe startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    NSString *actualID = result[@"id"];
    if ([currentToken.userID isEqualToString:actualID]) {
      [FBSDKAccessToken setCurrentAccessToken:loginResult.token];
      [self invokeHandler:loginResult error:nil];
    } else {
      NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
      [FBSDKBasicUtility dictionary:userInfo setObject:error forKey:NSUnderlyingErrorKey];
      NSError *resultError = [NSError errorWithDomain:FBSDKLoginErrorDomain
                                                 code:FBSDKLoginErrorUserMismatch
                                             userInfo:userInfo];
       [self invokeHandler:nil error:resultError];
    }
  }];
}

#pragma mark - Test Methods

- (void)setHandler:(FBSDKLoginManagerLoginResultBlock)handler
{
  _handler = [handler copy];
}

- (void)setRequestedPermissions:(NSSet *)requestedPermissions
{
  _requestedPermissions = [requestedPermissions copy];
}

// change bool to auth method string.
- (void)performBrowserLogInWithParameters:(NSDictionary *)loginParams
                                  handler:(FBSDKBrowserLoginSuccessBlock)handler
{
  [_logger willAttemptAppSwitchingBehavior];

  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  BOOL useSafariViewController = [configuration useSafariViewControllerForDialogName:FBSDKDialogConfigurationNameLogin];
  NSString *authMethod = (useSafariViewController ? FBSDKLoginManagerLoggerAuthMethod_SFVC : FBSDKLoginManagerLoggerAuthMethod_Browser);

  loginParams = [_logger parametersWithTimeStampAndClientState:loginParams forAuthMethod:authMethod];

  NSURL *authURL = nil;
  NSError *error;
  NSURL *redirectURL = [FBSDKInternalUtility appURLWithHost:@"authorize" path:@"" queryParameters:@{} error:&error];
  if (!error) {
    NSMutableDictionary *browserParams = [loginParams mutableCopy];
    [FBSDKBasicUtility dictionary:browserParams
                        setObject:redirectURL
                           forKey:@"redirect_uri"];
    authURL = [FBSDKInternalUtility facebookURLWithHostPrefix:@"m."
                                                         path:FBSDKOauthPath
                                              queryParameters:browserParams
                                                        error:&error];
  }
  if (authURL) {
    void(^handlerWrapper)(BOOL, NSError*) = ^(BOOL didOpen, NSError *anError) {
      if (handler) {
        handler(didOpen, authMethod, anError);
      }
    };

    if (useSafariViewController) {
      // Note based on above, authURL must be a http scheme. If that changes, add a guard, otherwise SFVC can throw
      self->_usedSFAuthSession = YES;
      [[FBSDKBridgeAPI sharedInstance] openURLWithSafariViewController:authURL
                                                                          sender:self
                                                              fromViewController:self.fromViewController
                                                                         handler:handlerWrapper];
    } else {
      [[FBSDKBridgeAPI sharedInstance] openURL:authURL sender:self handler:handlerWrapper];
    }
  } else {
    error = error ?: [FBSDKError errorWithCode:FBSDKLoginErrorUnknown message:@"Failed to construct oauth browser url"];
    if (handler) {
      handler(NO, nil, error);
    }
  }
}

#pragma mark - FBSDKURLOpening
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  BOOL isFacebookURL = [self canOpenURL:url forApplication:application sourceApplication:sourceApplication annotation:annotation];

  if (!isFacebookURL && [self isPerformingLogin]) {
    [self handleImplicitCancelOfLogIn];
  }

  if (isFacebookURL) {
    NSDictionary *urlParameters = [FBSDKLoginUtility queryParamsFromLoginURL:url];
    id<FBSDKLoginCompleting> completer = [[FBSDKLoginURLCompleter alloc] initWithURLParameters:urlParameters appID:[FBSDKSettings appID]];

    if (_logger == nil) {
      _logger = [FBSDKLoginManagerLogger loggerFromParameters:urlParameters];
    }

    // any necessary strong reference is maintained by the FBSDKLoginURLCompleter handler
    [completer completeLoginWithHandler:^(FBSDKLoginCompletionParameters *parameters) {
      [self completeAuthentication:parameters expectChallenge:YES];
    }];
  }

  return isFacebookURL;
}

- (BOOL)canOpenURL:(NSURL *)url
    forApplication:(UIApplication *)application
 sourceApplication:(NSString *)sourceApplication
        annotation:(id)annotation
{
  // verify the URL is intended as a callback for the SDK's log in
  return [url.scheme hasPrefix:[NSString stringWithFormat:@"fb%@", [FBSDKSettings appID]]] &&
  [url.host isEqualToString:@"authorize"];
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  if ([self isPerformingLogin]) {
    [self handleImplicitCancelOfLogIn];
  }
}

- (BOOL)isAuthenticationURL:(NSURL *)url
{
  return [url.path hasSuffix:FBSDKOauthPath];
}

@end
