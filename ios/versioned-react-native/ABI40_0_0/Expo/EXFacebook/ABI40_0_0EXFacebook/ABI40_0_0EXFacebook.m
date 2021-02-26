// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>

#import <ABI40_0_0UMConstantsInterface/ABI40_0_0UMConstantsInterface.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

NSString * const ABI40_0_0EXFacebookMisconfiguredErrorDomain = @"ERR_FACEBOOK_MISCONFIGURED";
NSString * const ABI40_0_0EXFacebookLoginErrorDomain = @"ERR_FACEBOOK_LOGIN";

@implementation ABI40_0_0EXFacebook

ABI40_0_0UM_EXPORT_MODULE(ExponentFacebook)

ABI40_0_0UM_EXPORT_METHOD_AS(setAutoLogAppEventsEnabledAsync,
                    setAutoLogAppEventsEnabled:(BOOL)enabled
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [FBSDKSettings setAutoLogAppEventsEnabled:enabled];
  resolve(nil);
}

ABI40_0_0UM_EXPORT_METHOD_AS(setAutoInitEnabledAsync,
                    setAutoInitEnabled:(BOOL)enabled
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  ABI40_0_0UMLogWarn(@"The `autoInitEnabled` option has been removed from Facebook SDK — we recommend to explicitly use `initializeAsync` instead.");
  resolve(nil);
}

ABI40_0_0UM_EXPORT_METHOD_AS(initializeAsync,
                    initializeAsync:(NSDictionary *)options
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  if (options[@"appId"]) {
    [FBSDKSettings setAppID:options[@"appId"]];
  }
  if (![FBSDKSettings appID]) {
    reject(ABI40_0_0EXFacebookMisconfiguredErrorDomain, @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
    return;
  }
  // Caller overrides buildtime settings
  if (options[@"appName"]) {
    [FBSDKSettings setDisplayName:options[@"appName"]];
  }
  if (options[@"version"]) {
    [FBSDKSettings setGraphAPIVersion:options[@"version"]];
  }
  if (options[@"autoLogAppEvents"]) {
    [FBSDKSettings setAutoLogAppEventsEnabled:[options[@"autoLogAppEvents"] boolValue]];
  }

  [FBSDKApplicationDelegate initializeSDK:nil];
  resolve(nil);
}

ABI40_0_0UM_EXPORT_METHOD_AS(setAdvertiserIDCollectionEnabledAsync,
                    setAdvertiserIDCollectionEnabled:(BOOL)enabled
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  [FBSDKSettings setAdvertiserIDCollectionEnabled:enabled];
  resolve(nil);
}

ABI40_0_0UM_EXPORT_METHOD_AS(logOutAsync,
                    logOutAsync:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  FBSDKLoginManager *loginManager = [[FBSDKLoginManager alloc] init];
  [loginManager logOut];
  resolve(nil);
}

ABI40_0_0UM_EXPORT_METHOD_AS(getAuthenticationCredentialAsync,
                    getAuthenticationCredentialAsync:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  FBSDKAccessToken *currentAccessToken = [FBSDKAccessToken currentAccessToken];
  resolve(ABI40_0_0UMNullIfNil([ABI40_0_0EXFacebook accessTokenNativeToJSON:currentAccessToken]));
}

ABI40_0_0UM_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithConfig:(NSDictionary *)config
                    resolver:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  if (![FBSDKSettings appID]) {
    reject(ABI40_0_0EXFacebookMisconfiguredErrorDomain, @"No appId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
    return;
  }

  NSArray *permissions = config[@"permissions"];
  if (!permissions) {
    permissions = @[@"public_profile", @"email"];
  }

  // FB SDK requires login to run on main thread
  // Needs to not race with other mutations of this global FB state
  dispatch_async(dispatch_get_main_queue(), ^{
    FBSDKLoginManager *loginManager = [[FBSDKLoginManager alloc] init];
    [loginManager logOut];

    @try {
      [loginManager logInWithPermissions:permissions fromViewController:nil handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
        if (error) {
          reject(ABI40_0_0EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }

        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }

        NSMutableDictionary *accessToken = [NSMutableDictionary dictionaryWithDictionary:[ABI40_0_0EXFacebook accessTokenNativeToJSON:result.token]];
        accessToken[@"type"] = @"success";
        resolve(accessToken);
      }];
    }
    @catch (NSException *exception) {
      NSError *error = [[NSError alloc] initWithDomain:ABI40_0_0EXFacebookLoginErrorDomain code:650 userInfo:@{
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

+ (NSDictionary *)accessTokenNativeToJSON:(FBSDKAccessToken *)input {
  if (!input) {
    return nil;
  }

  return @{
    @"token": input.tokenString,
    @"userId": input.userID,
    @"appId": input.appID,

    @"permissions": [input.permissions allObjects],
    @"declinedPermissions": [input.declinedPermissions allObjects],
    @"expiredPermissions": [input.expiredPermissions allObjects],
    
    @"expirationDate": @([input.expirationDate timeIntervalSince1970] * 1000),
    @"dataAccessExpirationDate": @([input.dataAccessExpirationDate timeIntervalSince1970] * 1000),

    @"refreshDate": @([input.refreshDate timeIntervalSince1970] * 1000),
  };
}

@end
