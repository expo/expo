// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXGoogle.h"
#import "EXOAuthViewController.h"
#import "EXScopedModuleRegistry.h"

#import <GoogleSignIn/GoogleSignIn.h>
#import <AppAuth.h>
#import <React/RCTUtils.h>

NSString *EXGoogleErrorCode = @"GOOGLE_ERROR";

@interface EXGoogle () <GIDSignInDelegate, GIDSignInUIDelegate>

@property (nonatomic, weak) id kernelGoogleAuthServiceDelegate;

@end

@implementation EXGoogle
{
  RCTPromiseResolveBlock _logInResolve;
  RCTPromiseRejectBlock _logInReject;
}

EX_EXPORT_SCOPED_MODULE(ExponentGoogle, GoogleAuthManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelGoogleAuthServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(logInAsync,
                 config:(NSDictionary *)config
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_logInResolve != nil) {
    reject(EXGoogleErrorCode, @"Another login request is already in progress.", nil);
    return;
  }
  _logInResolve = resolve;
  _logInReject = reject;
  NSString *behavior = config[@"behavior"];
  if ([behavior isEqualToString:@"system"]) {
    [self systemLogInWithIosClientId:config[@"iosClientId"]
                         webClientId:config[@"webClientId"]
                              scopes:config[@"scopes"]];
  } else if ([behavior isEqualToString:@"web"]) {
    [self webLogInWithClientId:config[@"iosClientId"] scopes:config[@"scopes"]];
  } else {
    reject(EXGoogleErrorCode, [NSString stringWithFormat:@"Invalid behavior %@", behavior], nil);
  }
}

-(void)systemLogInWithIosClientId:(NSString *)clientId
                      webClientId:(NSString *)webClientId
                           scopes:(NSArray<NSString *> *)scopes
{
  [GIDSignIn sharedInstance].delegate = self;
  [GIDSignIn sharedInstance].uiDelegate = self;
  [GIDSignIn sharedInstance].clientID = clientId;
  if (webClientId != nil) {
    [GIDSignIn sharedInstance].serverClientID = webClientId;
  }
  [GIDSignIn sharedInstance].scopes = scopes;
  [GIDSignIn sharedInstance].shouldFetchBasicProfile = YES;
  [[GIDSignIn sharedInstance] signIn];
}

-(void)webLogInWithClientId:(NSString *)clientId scopes: (NSArray<NSString *> *)scopes
{
  NSURL *authorizationEndpoint = [NSURL URLWithString:@"https://accounts.google.com/o/oauth2/v2/auth"];
  NSURL *tokenEndpoint = [NSURL URLWithString:@"https://www.googleapis.com/oauth2/v4/token"];
  // Get the Google redirect scheme from Info.plist.
  NSArray *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];
  __block NSArray *urlSchemes;
  [urlTypes enumerateObjectsUsingBlock:^(id _Nonnull urlType, NSUInteger idx,  BOOL * _Nonnull stop) {
    if ([[urlType objectForKey:@"CFBundleURLName"] isEqualToString:@"OAuthRedirect"]) {
      urlSchemes = [(NSDictionary *)urlType objectForKey:@"CFBundleURLSchemes"];
      *stop = YES;
    }
  }];
  if (!urlSchemes || !urlSchemes.count) {
    _logInReject(EXGoogleErrorCode,
                 @"Google sign in error",
                 RCTErrorWithMessage(@"No OAuthRedirect bundle url type was configured in this app's Info.plist."));
    _logInResolve = nil;
    _logInReject = nil;
    return;
  }
  NSString *urlScheme = [urlSchemes objectAtIndex:0];
  NSURL *redirect = [NSURL URLWithString:[NSString stringWithFormat:@"%@:/oauthredirect", urlScheme]];

  OIDServiceConfiguration *configuration =
    [[OIDServiceConfiguration alloc] initWithAuthorizationEndpoint:authorizationEndpoint
                                                     tokenEndpoint:tokenEndpoint];

  OIDAuthorizationRequest *request =
    [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                  clientId:clientId
                                                    scopes:scopes
                                               redirectURL:redirect
                                              responseType:OIDResponseTypeCode
                                      additionalParameters:nil];

  OIDAuthStateAuthorizationCallback callback = ^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
    if (authState) {
      if (authState.isAuthorized) {
        _logInResolve(@{
          @"type": @"success",
          @"accessToken": RCTNullIfNil(authState.lastTokenResponse.accessToken),
          @"idToken": RCTNullIfNil(authState.lastTokenResponse.idToken),
          @"refreshToken": RCTNullIfNil(authState.lastTokenResponse.refreshToken),
          @"serverAuthCode": RCTNullIfNil(authState.lastAuthorizationResponse.authorizationCode),
        });
      } else {
        _logInResolve(@{@"type": @"cancel"});
      }
    } else {
      _logInReject(EXGoogleErrorCode, @"Google sign in error", error);
    }

    _logInResolve = nil;
    _logInReject = nil;
  };

  id<OIDAuthorizationFlowSession> currentAuthorizationFlow =
    [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                   presentingViewController:RCTPresentedViewController()
                                                   callback:callback];
  [_kernelGoogleAuthServiceDelegate googleModule:self didBeginOAuthFlow:currentAuthorizationFlow];
}

-(void)signIn:(GIDSignIn *)signIn didSignInForUser:(GIDGoogleUser *)user withError:(NSError *)error
{
  if (error != nil) {
    if (error.code == kGIDSignInErrorCodeCanceled) {
      _logInResolve(@{@"type": @"cancel"});
    } else {
      _logInReject(EXGoogleErrorCode, @"Google sign in error", error);
    }
  } else {
    _logInResolve(@{
      @"type": @"success",
      @"accessToken": RCTNullIfNil(user.authentication.accessToken),
      @"serverAuthCode": RCTNullIfNil(user.serverAuthCode),
      @"idToken": RCTNullIfNil(user.authentication.idToken),
      @"refreshToken": RCTNullIfNil(user.authentication.refreshToken),
      @"user": @{
        @"id": RCTNullIfNil(user.userID),
        @"name": RCTNullIfNil(user.profile.name),
        @"familyName": RCTNullIfNil(user.profile.familyName),
        @"givenName": RCTNullIfNil(user.profile.givenName),
        @"email": RCTNullIfNil(user.profile.email),
        @"photoUrl": user.profile.hasImage ?
          [[user.profile imageURLWithDimension:96] absoluteString] :
          [NSNull null],
      },
    });
  }

  _logInResolve = nil;
  _logInReject = nil;
}

-(void)signIn:(GIDSignIn *)signIn presentViewController:(UIViewController *)viewController
{
  [RCTPresentedViewController() presentViewController:viewController animated:YES completion:nil];
}

-(void)signIn:(GIDSignIn *)signIn dismissViewController:(UIViewController *)viewController
{
  [RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

@end
