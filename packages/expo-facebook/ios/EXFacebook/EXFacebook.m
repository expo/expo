// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebook.h>

#import <UMConstantsInterface/UMConstantsInterface.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

NSString * const EXFacebookLoginErrorDomain = @"E_FBLOGIN";
NSString * const EXFacebookLoginAppIdErrorDomain = @"E_FBLOGIN_APP_ID";

@implementation EXFacebook

UM_EXPORT_MODULE(ExponentFacebook)

UM_EXPORT_METHOD_AS(setAutoLogAppEventsEnabledAsync,
                    setAutoLogAppEventsEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [FBSDKSettings setAutoLogAppEventsEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setAutoInitEnabledAsync,
                    setAutoInitEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // If enabled is true, the line below will initialize the SDK.
  // This behavior is different than on Android where one needs
  // to initialize the SDK explicitly. We have no power over this,
  // and to mitigate this difference we will NOT add initializing
  // to the respective method on Android, but we will instruct users
  // to initialize the SDK manually on both platforms instead.
  [FBSDKSettings setAutoInitEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(initializeAsync,
                    initializeWithAppId:(NSString *)appId
                    appName:(NSString *)appName
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  if (appId) {
    [FBSDKSettings setAppID:appId];
  }
  if (![FBSDKSettings appID]) {
    reject(@"E_CONF_ERROR", @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
    return;
  }
  // Caller overrides buildtime settings
  if (appName) {
    [FBSDKSettings setDisplayName:appName];
  }
  [FBSDKApplicationDelegate initializeSDK:nil];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setAdvertiserIDCollectionEnabledAsync,
                    setAdvertiserIDCollectionEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  [FBSDKSettings setAdvertiserIDCollectionEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithConfig:(NSDictionary *)config
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (![FBSDKSettings appID]) {
    reject(@"E_CONF_ERROR", @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
    return;
  }

  NSArray *permissions = config[@"permissions"];
  if (!permissions) {
    permissions = @[@"public_profile", @"email"];
  }

  // FB SDK requires login to run on main thread
  // Needs to not race with other mutations of this global FB state
  dispatch_async(dispatch_get_main_queue(), ^{
    FBSDKLoginManager *loginMgr = [[FBSDKLoginManager alloc] init];
    [loginMgr logOut];

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

@end
