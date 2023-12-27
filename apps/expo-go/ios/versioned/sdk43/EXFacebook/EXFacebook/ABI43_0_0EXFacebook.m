// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXFacebook/ABI43_0_0EXFacebook.h>
#import <ABI43_0_0EXFacebook/ABI43_0_0EXFacebookAppTrackingPermissionRequester.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKCoreKit/FBSDKAppEventsUtility.h>

NSString * const ABI43_0_0EXFacebookMisconfiguredErrorDomain = @"ERR_FACEBOOK_MISCONFIGURED";
NSString * const ABI43_0_0EXFacebookLoginErrorDomain = @"ERR_FACEBOOK_LOGIN";
static NSString *const FBSDKAppEventsPushPayloadKey = @"fb_push_payload";
static NSString *const FBSDKAppEventsPushPayloadCampaignKey = @"campaign";

@interface ABI43_0_0EXFacebook ()

@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXFacebook

ABI43_0_0EX_EXPORT_MODULE(ExponentFacebook)

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXFacebookAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXFacebookAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXFacebookAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setAdvertiserTrackingEnabledAsync,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  BOOL result = [FBSDKSettings setAdvertiserTrackingEnabled:enabled];
  resolve(@(result));
}

ABI43_0_0EX_EXPORT_METHOD_AS(setAutoLogAppEventsEnabledAsync,
                    setAutoLogAppEventsEnabled:(BOOL)enabled
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKSettings setAutoLogAppEventsEnabled:enabled];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(initializeAsync,
                    initializeAsync:(NSDictionary *)options
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  if (options[@"appId"]) {
    [FBSDKSettings setAppID:options[@"appId"]];
  }
  if (![FBSDKSettings appID]) {
    reject(ABI43_0_0EXFacebookMisconfiguredErrorDomain, @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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

ABI43_0_0EX_EXPORT_METHOD_AS(setAdvertiserIDCollectionEnabledAsync,
                    setAdvertiserIDCollectionEnabled:(BOOL)enabled
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  [FBSDKSettings setAdvertiserIDCollectionEnabled:enabled];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(logOutAsync,
                    logOutAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  FBSDKLoginManager *loginManager = [[FBSDKLoginManager alloc] init];
  [loginManager logOut];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getAuthenticationCredentialAsync,
                    getAuthenticationCredentialAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  FBSDKAccessToken *currentAccessToken = [FBSDKAccessToken currentAccessToken];
  resolve(ABI43_0_0EXNullIfNil([ABI43_0_0EXFacebook accessTokenNativeToJSON:currentAccessToken]));
}

ABI43_0_0EX_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithConfig:(NSDictionary *)config
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (![FBSDKSettings appID]) {
    reject(ABI43_0_0EXFacebookMisconfiguredErrorDomain, @"No appId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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
          reject(ABI43_0_0EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }
        
        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }
        
        NSMutableDictionary *accessToken = [NSMutableDictionary dictionaryWithDictionary:[ABI43_0_0EXFacebook accessTokenNativeToJSON:result.token]];
        accessToken[@"type"] = @"success";
        resolve(accessToken);
      }];
    } @catch (NSException *exception) {
      NSError *error = [[NSError alloc] initWithDomain:ABI43_0_0EXFacebookLoginErrorDomain code:650 userInfo:@{
        NSLocalizedDescriptionKey: exception.description,
        NSLocalizedFailureReasonErrorKey: exception.reason,
        @"ExceptionUserInfo": exception.userInfo ?: @{},
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

ABI43_0_0EX_EXPORT_METHOD_AS(logEventAsync,
                    logEvent:(NSString *)eventName
                    valueToSum:(nonnull NSNumber *)valueToSum
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logEvent:eventName
                valueToSum:valueToSum
                parameters:parameters
               accessToken:nil];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(logPurchaseAsync,
                    logPurchase:(NSNumber *)purchaseAmount
                    currency:(NSString *)currency
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logPurchase:[purchaseAmount doubleValue]
                     currency:currency
                   parameters:parameters
                  accessToken:nil];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(logPushNotificationOpenAsync,
                    logPushNotificationOpen:(NSString *)campaign
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary *payload = @{
    FBSDKAppEventsPushPayloadKey: @{
      FBSDKAppEventsPushPayloadCampaignKey: campaign
    }
  };
  [FBSDKAppEvents logPushNotificationOpen:payload];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserIDAsync,
                    setUserID:(NSString *)userID
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setUserID:userID];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getUserIDAsync,
                    getUserID:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([FBSDKAppEvents userID]);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getAnonymousIDAsync,
                    getAnonymousID:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  @try {
    NSString *anonymousID = [FBSDKAppEvents anonymousID];
    resolve(anonymousID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ANONYMOUS_ID", @"Can not get anonymousID", error);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(getAdvertiserIDAsync,
                    getAdvertiserID:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  @try {
    NSString *advertiserID = [FBSDKAppEventsUtility advertiserID];
    resolve(advertiserID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ADVERTISER_ID", @"Can not get advertiserID", error);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserDataAsync,
                    setUserData:(NSDictionary *)userData
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  userData = dictionaryWithNullValuesAsStrings(userData);
  
  [FBSDKAppEvents setUserEmail:userData[@"email"]
                     firstName:userData[@"firstName"]
                      lastName:userData[@"lastName"]
                         phone:userData[@"phone"]
                   dateOfBirth:userData[@"dateOfBirth"]
                        gender:userData[@"gender"]
                          city:userData[@"city"]
                         state:userData[@"state"]
                           zip:userData[@"zip"]
                       country:userData[@"country"]];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setFlushBehaviorAsync,
                    setFlushBehavior:(FBSDKAppEventsFlushBehavior)flushBehavior
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setFlushBehavior:flushBehavior];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(flushAsync,
                    flush:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKAppEvents flush];
  resolve(nil);
}

static NSDictionary<NSString *, id> *dictionaryWithNullValuesAsStrings(NSDictionary<NSString *, id> *input)
{
  if (input == nil) {
    return nil;
  }
  NSMutableDictionary<NSString *, id> *result = [[NSMutableDictionary alloc] initWithCapacity:[input count]];
  [input enumerateKeysAndObjectsUsingBlock:^(NSString *key, id item, __unused BOOL *stop) {
    if ([item isKindOfClass:[NSNull class]]) {
      result[key] = @"null";
    } else {
      result[key] = item;
    }
  }];
  return result;
}


@end
