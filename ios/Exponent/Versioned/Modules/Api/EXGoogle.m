// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXGoogle.h"

#import <GoogleSignIn/GoogleSignIn.h>
#import <AppAuth.h>

#import "RCTUtils.h"
#import "EXOAuthViewController.h"
#import "ExponentViewManager.h"
#import "EXUnversioned.h"

NSString *EXGoogleErrorCode = @"GOOGLE_ERROR";

@interface EXGoogle () <GIDSignInDelegate, GIDSignInUIDelegate>

@end

@implementation EXGoogle
{
  RCTPromiseResolveBlock _logInResolve;
  RCTPromiseRejectBlock _logInReject;
}

RCT_EXPORT_MODULE(ExponentGoogle)

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
    [self systemLogInWithClientId:config[@"iosClientId"] scopes:config[@"scopes"]];
  } else if ([behavior isEqualToString:@"web"]) {
    [self webLogInWithClientId:config[@"iosClientId"] scopes:config[@"scopes"]];
  } else {
    reject(EXGoogleErrorCode, [NSString stringWithFormat:@"Invalid behavior %@", behavior], nil);
  }
}

-(void)systemLogInWithClientId:(NSString *)clientId scopes:(NSArray<NSString *> *)scopes
{
  [GIDSignIn sharedInstance].delegate = self;
  [GIDSignIn sharedInstance].uiDelegate = self;
  [GIDSignIn sharedInstance].clientID = clientId;
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
          @"accessToken": authState.lastTokenResponse.accessToken,
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

  [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXDidBeginOAuthFlow")
                                                      object:self
                                                    userInfo:@{@"authorizationFlow": currentAuthorizationFlow}];
}

-(void)signIn:(GIDSignIn *)signIn didSignInForUser:(GIDGoogleUser *)user withError:(NSError *)error
{
  if (error != nil) {
    _logInReject(EXGoogleErrorCode, @"Google sign in error", error);
  } else {
    _logInResolve(@{
      @"type": @"success",
      @"accessToken": user.authentication.accessToken,
      @"serverAuthCode": user.serverAuthCode ? user.serverAuthCode : [NSNull null],
      @"idToken": user.authentication.idToken ? user.authentication.idToken : [NSNull null],
      @"user": @{
        @"id": user.userID,
        @"name": user.profile.name,
        @"familyName": user.profile.familyName,
        @"givenName": user.profile.givenName,
        @"email": user.profile.email ? user.profile.email : [NSNull null],
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
