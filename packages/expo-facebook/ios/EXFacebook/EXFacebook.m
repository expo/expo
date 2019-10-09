// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebook.h>

#import <UMConstantsInterface/UMConstantsInterface.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

NSString * const EXFacebookLoginErrorDomain = @"E_FBLOGIN";
NSString * const EXFacebookLoginAppIdErrorDomain = @"E_FBLOGIN_APP_ID";

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

  // FB SDK requires login to run on main thread
  // Needs to not race with other mutations of this global FB state
  dispatch_async(dispatch_get_main_queue(), ^{
    [FBSDKSettings setAppID:appId];
    FBSDKLoginManager *loginMgr = [[FBSDKLoginManager alloc] init];
    [loginMgr logOut];
    if (![[self class] facebookAppIdFromNSBundle]) {
      // We can't reliably execute login without an appId in Info.plist.
      NSString *message = [NSString stringWithFormat:
                           @"Tried to perform Facebook login, but no Facebook app id was provided."
                           " Specify Facebook app id in Info.plist."];
      reject(EXFacebookLoginAppIdErrorDomain, message, UMErrorWithMessage(message));
      return;
    }

    @try {
      [loginMgr logInWithPermissions:permissions fromViewController:nil handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
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
