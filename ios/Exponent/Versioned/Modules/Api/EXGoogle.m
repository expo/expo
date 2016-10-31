// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXGoogle.h"

#import <GoogleSignIn/GoogleSignIn.h>

#import "RCTUtils.h"
#import "EXOAuthViewController.h"

NSString *EXGoogleErrorCode = @"GOOGLE_ERROR";

@interface EXGoogle () <GIDSignInDelegate, GIDSignInUIDelegate, EXOAuthViewControllerDelegate>

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
    [self systemLogInWithClientId:config[@"iosClientId"]
                      webClientId:config[@"webClientId"]
                           scopes:config[@"scopes"]];
  } else if ([behavior isEqualToString:@"web"]) {
    [self webLogInWithClientId:config[@"webClientId"] scopes:config[@"scopes"]];
  } else {
    reject(EXGoogleErrorCode, [NSString stringWithFormat:@"Invalid behavior %@", behavior], nil);
  }
}

-(void)systemLogInWithClientId:(NSString *)clientId webClientId:(NSString *)webClientId scopes:(NSArray<NSString *> *)scopes
{
  [GIDSignIn sharedInstance].delegate = self;
  [GIDSignIn sharedInstance].uiDelegate = self;
  [GIDSignIn sharedInstance].clientID = clientId;
  [GIDSignIn sharedInstance].scopes = scopes;
  [GIDSignIn sharedInstance].serverClientID = webClientId;
  [GIDSignIn sharedInstance].shouldFetchBasicProfile = YES;
  [[GIDSignIn sharedInstance] signIn];
}

-(void)webLogInWithClientId:(NSString *)clientId scopes: (NSArray<NSString *> *)scopes
{
  EXOAuthViewController *viewController = [EXOAuthViewController new];
  viewController.url = [NSString stringWithFormat:
                        @"https://accounts.google.com/o/oauth2/v2/auth?scope=%@&redirect_uri=https://oauth.host.exp.com&response_type=token&client_id=%@",
                        [scopes componentsJoinedByString: @"%20"],
                        clientId];
  viewController.delegate = self;
  [RCTPresentedViewController() presentViewController:viewController animated:YES completion:nil];
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

-(void)oAuthViewControler:(EXOAuthViewController *)viewController didReceiveResult:(NSString *)result
{
  result = [result stringByReplacingOccurrencesOfString:@"/#" withString:@"?"];

  NSURLComponents *components = [NSURLComponents componentsWithString:result];
  NSUInteger tokenIndex = [components.queryItems indexOfObjectPassingTest:^BOOL(NSURLQueryItem * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    return [obj.name isEqualToString: @"access_token"];
  }];
  if (tokenIndex != NSNotFound) {
    _logInResolve(@{
      @"type": @"success",
      @"accessToken": components.queryItems[tokenIndex].value,
    });
  } else {
    _logInReject(EXGoogleErrorCode, [NSString stringWithFormat: @"No token found, received: %@.", result], nil);
  }

  _logInResolve = nil;
  _logInReject = nil;

  [RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

-(void)oAuthViewControlerDidCancel:(EXOAuthViewController *)viewController
{
  _logInResolve(@{@"type": @"cancel"});

  _logInResolve = nil;
  _logInReject = nil;

  [RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

@end
