// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXFacebook/ABI34_0_0EXFacebook.h>

#import <ABI34_0_0UMConstantsInterface/ABI34_0_0UMConstantsInterface.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

NSString * const ABI34_0_0EXFacebookLoginErrorDomain = @"E_FBLOGIN";
NSString * const ABI34_0_0EXFacebookLoginAppIdErrorDomain = @"E_FBLOGIN_APP_ID";

@implementation ABI34_0_0EXFacebook

ABI34_0_0UM_EXPORT_MODULE(ExponentFacebook)

ABI34_0_0UM_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithAppId:(NSString *)appId
                    config:(NSDictionary *)config
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  NSArray *permissions = config[@"permissions"];
  if (!permissions) {
    permissions = @[@"public_profile", @"email"];
  }

  if (![config[@"behavior"] isEqualToString:@"browser"]) {
    ABI34_0_0UMLogWarn(@"In the most recent version of Expo Client (which you're running) and in SDK35+ any login behavior other than `browser` will fall back to `browser`. This change is an effect of upgrading underlying Facebook SDK to latest version, which removed all other behaviors. For more details on this change please consult Expo's changelog available at https://github.com/expo/expo.");
  }

  // FB SDK requires login to run on main thread
  // Needs to not race with other mutations of this global FB state
  dispatch_async(dispatch_get_main_queue(), ^{
    [FBSDKAccessToken setCurrentAccessToken:nil];
    [FBSDKSettings setAppID:appId];
    FBSDKLoginManager *loginMgr = [[FBSDKLoginManager alloc] init];

    if (![[self class] facebookAppIdFromNSBundle]) {
      // We can't reliably execute login without an appId in Info.plist.
      NSString *message = [NSString stringWithFormat:
                           @"Tried to perform Facebook login, but no Facebook app id was provided."
                           " Specify Facebook app id in Info.plist."];
      reject(ABI34_0_0EXFacebookLoginAppIdErrorDomain, message, ABI34_0_0UMErrorWithMessage(message));
      return;
    }

    @try {
      [loginMgr logInWithPermissions:permissions fromViewController:nil handler:^(FBSDKLoginManagerLoginResult * _Nullable result, NSError * _Nullable error) {
        if (error) {
          reject(ABI34_0_0EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }

        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }

        if (![result.token.appID isEqualToString:appId]) {
          reject(ABI34_0_0EXFacebookLoginErrorDomain, @"Logged into wrong app, try again?", nil);
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
      NSError *error = [[NSError alloc] initWithDomain:ABI34_0_0EXFacebookLoginErrorDomain code:650 userInfo:@{
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
