// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebook.h>

#import <UMConstantsInterface/UMConstantsInterface.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import "../Private/FBSDKCoreKit/FBSDKInternalUtility.h"

@implementation FBSDKInternalUtility (EXFacebook)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-protocol-method-implementation"
+ (BOOL)isRegisteredURLScheme:(NSString *)urlScheme
{
  // !!!: Make FB SDK think we can open fb<app id>:// urls
  return ![@[FBSDK_CANOPENURL_FACEBOOK, FBSDK_CANOPENURL_MESSENGER, FBSDK_CANOPENURL_FBAPI, FBSDK_CANOPENURL_SHARE_EXTENSION]
           containsObject:urlScheme];
}
#pragma clang diagnostic pop

@end

NSString * const EXFacebookLoginErrorDomain = @"E_FBLOGIN";
NSString * const EXFacebookLoginBehaviorErrorDomain = @"E_FBLOGIN_BEHAVIOR";

@implementation EXFacebook

UM_EXPORT_MODULE(ExponentFacebook)

UM_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithAppId:(NSString *)appId
                    config:(NSDictionary *)config
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSArray *permissions = config[@"permissions"];
  if (!permissions) {
    permissions = @[@"public_profile", @"email"];
  }

  NSString *behavior = config[@"behavior"];

  // FB SDK requires login to run on main thread
  // Needs to not race with other mutations of this global FB state
  dispatch_async(dispatch_get_main_queue(), ^{
    [FBSDKAccessToken setCurrentAccessToken:nil];
    [FBSDKSettings setAppID:appId];
    FBSDKLoginManager *loginMgr = [[FBSDKLoginManager alloc] init];

    loginMgr.loginBehavior = FBSDKLoginBehaviorSystemAccount;
    if (behavior) {
      // TODO: Support other logon behaviors?
      //       - browser is problematic because it navigates to fb<appid>:// when done
      //       - system is problematic because it asks whether to give 'Exponent' permissions,
      //         just a weird user-facing UI
      if ([behavior isEqualToString:@"native"]) {
        loginMgr.loginBehavior = FBSDKLoginBehaviorNative;
      } else if ([behavior isEqualToString:@"browser"]) {
        loginMgr.loginBehavior = FBSDKLoginBehaviorBrowser;
      } else if ([behavior isEqualToString:@"system"]) {
        loginMgr.loginBehavior = FBSDKLoginBehaviorSystemAccount;
      } else if ([behavior isEqualToString:@"web"]) {
        loginMgr.loginBehavior = FBSDKLoginBehaviorWeb;
      }
    }

    if (loginMgr.loginBehavior != FBSDKLoginBehaviorWeb) {
      if (![[self class] facebookAppIdFromNSBundle]) {
        // We can't reliably execute non-web login
        // without an appId in Info.plist.
        NSString *message = [NSString stringWithFormat:
                             @"Tried to perform Facebook login with behavior `%@`, but "
                             "no Facebook app id was provided. Specify Facebook app id in Info.plist "
                             "or switch to `web` behavior.", behavior];
        reject(EXFacebookLoginBehaviorErrorDomain, message, UMErrorWithMessage(message));
        return;
      }
    }

    @try {
      [loginMgr logInWithReadPermissions:permissions fromViewController:nil handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
        if (error) {
          reject(EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }

        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }

        if (![result.token.appID isEqualToString:appId]) {
          reject(EXFacebookLoginErrorDomain, @"Logged into wrong app, try again?", nil);
          return;
        }

        NSInteger expiration = [result.token.expirationDate timeIntervalSince1970];
        resolve(@{
                  @"type": @"success",
                  @"token": result.token.tokenString,
                  @"expires": @(expiration),
                  @"permissions": [result.token.permissions allObjects],
                  @"declinedPermissions": [result.token.declinedPermissions allObjects]
                  });
      }];
    }
    @catch (NSException *exception) {
      NSError *error = [[NSError alloc] initWithDomain:EXFacebookLoginErrorDomain code:650 userInfo:@{
                                                                                                      NSLocalizedDescriptionKey: exception.description,
                                                                                                      NSLocalizedFailureReasonErrorKey: exception.reason,
                                                                                                      @"ExceptionUserInfo": exception.userInfo,
                                                                                                      @"ExceptionCallStackSymbols": exception.callStackSymbols,
                                                                                                      @"ExceptionCallStackReturnAddresses": exception.callStackReturnAddresses,
                                                                                                      @"ExceptionName": exception.name
                                                                                                      }];
      reject(error.domain, exception.reason, error);
    }
  });
}

+ (id)facebookAppIdFromNSBundle
{
  return [[NSBundle mainBundle].infoDictionary objectForKey:@"FacebookAppID"];
}

@end
