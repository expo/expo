// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXGoogle.h"

#import <GoogleSignIn/GoogleSignIn.h>

#import "ABI11_0_0RCTUtils.h"
#import "ABI11_0_0EXOAuthViewController.h"

NSString *ABI11_0_0EXGoogleErrorCode = @"GOOGLE_ERROR";

@interface ABI11_0_0EXGoogle () <GIDSignInDelegate, GIDSignInUIDelegate, ABI11_0_0EXOAuthViewControllerDelegate>

@end

@implementation ABI11_0_0EXGoogle
{
  ABI11_0_0RCTPromiseResolveBlock _logInResolve;
  ABI11_0_0RCTPromiseRejectBlock _logInReject;
}

ABI11_0_0RCT_EXPORT_MODULE(ExponentGoogle)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI11_0_0RCT_REMAP_METHOD(logInAsync,
                 config:(NSDictionary *)config
                 resolver:(ABI11_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject)
{
  if (_logInResolve != nil) {
    reject(ABI11_0_0EXGoogleErrorCode, @"Another login request is already in progress.", nil);
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
    reject(ABI11_0_0EXGoogleErrorCode, [NSString stringWithFormat:@"Invalid behavior %@", behavior], nil);
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
  ABI11_0_0EXOAuthViewController *viewController = [ABI11_0_0EXOAuthViewController new];
  viewController.url = [NSString stringWithFormat:
                        @"https://accounts.google.com/o/oauth2/v2/auth?scope=%@&redirect_uri=https://oauth.host.exp.com&response_type=token&client_id=%@",
                        [scopes componentsJoinedByString: @"%20"],
                        clientId];
  viewController.delegate = self;
  [ABI11_0_0RCTPresentedViewController() presentViewController:viewController animated:YES completion:nil];
}

-(void)signIn:(GIDSignIn *)signIn didSignInForUser:(GIDGoogleUser *)user withError:(NSError *)error
{
  if (error != nil) {
    _logInReject(ABI11_0_0EXGoogleErrorCode, @"Google sign in error", error);
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
  [ABI11_0_0RCTPresentedViewController() presentViewController:viewController animated:YES completion:nil];
}

-(void)signIn:(GIDSignIn *)signIn dismissViewController:(UIViewController *)viewController
{
  [ABI11_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

-(void)oAuthViewControler:(ABI11_0_0EXOAuthViewController *)viewController didReceiveResult:(NSString *)result
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
    _logInReject(ABI11_0_0EXGoogleErrorCode, [NSString stringWithFormat: @"No token found, received: %@.", result], nil);
  }

  _logInResolve = nil;
  _logInReject = nil;

  [ABI11_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

-(void)oAuthViewControlerDidCancel:(ABI11_0_0EXOAuthViewController *)viewController
{
  _logInResolve(@{@"type": @"cancel"});

  _logInResolve = nil;
  _logInReject = nil;

  [ABI11_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:nil];
}

@end
