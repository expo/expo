// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXFacebook/ABI45_0_0EXFacebook.h>
#import <ABI45_0_0EXFacebook/ABI45_0_0EXFacebookAppTrackingPermissionRequester.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsMethodsDelegate.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKCoreKit/FBSDKAppEventsUtility.h>

NSString * const ABI45_0_0EXFacebookMisconfiguredErrorDomain = @"ERR_FACEBOOK_MISCONFIGURED";
NSString * const ABI45_0_0EXFacebookLoginErrorDomain = @"ERR_FACEBOOK_LOGIN";
static NSString *const FBSDKAppEventsPushPayloadKey = @"fb_push_payload";
static NSString *const FBSDKAppEventsPushPayloadCampaignKey = @"campaign";

@interface ABI45_0_0EXFacebook ()

@property (nonatomic, weak) id<ABI45_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI45_0_0EXFacebook

ABI45_0_0EX_EXPORT_MODULE(ExponentFacebook)

- (void)setModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXPermissionsInterface)];
  [ABI45_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI45_0_0EXFacebookAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI45_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI45_0_0EXFacebookAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI45_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI45_0_0EXFacebookAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI45_0_0EX_EXPORT_METHOD_AS(setAdvertiserTrackingEnabledAsync,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  BOOL result = [FBSDKSettings setAdvertiserTrackingEnabled:enabled];
  resolve(@(result));
}

ABI45_0_0EX_EXPORT_METHOD_AS(setAutoLogAppEventsEnabledAsync,
                    setAutoLogAppEventsEnabled:(BOOL)enabled
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKSettings setAutoLogAppEventsEnabled:enabled];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(initializeAsync,
                    initializeAsync:(NSDictionary *)options
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  if (options[@"appId"]) {
    [FBSDKSettings setAppID:options[@"appId"]];
  }
  if (![FBSDKSettings appID]) {
    reject(ABI45_0_0EXFacebookMisconfiguredErrorDomain, @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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

ABI45_0_0EX_EXPORT_METHOD_AS(setAdvertiserIDCollectionEnabledAsync,
                    setAdvertiserIDCollectionEnabled:(BOOL)enabled
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  [FBSDKSettings setAdvertiserIDCollectionEnabled:enabled];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(logOutAsync,
                    logOutAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  FBSDKLoginManager *loginManager = [[FBSDKLoginManager alloc] init];
  [loginManager logOut];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(getAuthenticationCredentialAsync,
                    getAuthenticationCredentialAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  FBSDKAccessToken *currentAccessToken = [FBSDKAccessToken currentAccessToken];
  resolve(ABI45_0_0EXNullIfNil([ABI45_0_0EXFacebook accessTokenNativeToJSON:currentAccessToken]));
}

ABI45_0_0EX_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithConfig:(NSDictionary *)config
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  if (![FBSDKSettings appID]) {
    reject(ABI45_0_0EXFacebookMisconfiguredErrorDomain, @"No appId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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
          reject(ABI45_0_0EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }
        
        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }
        
        NSMutableDictionary *accessToken = [NSMutableDictionary dictionaryWithDictionary:[ABI45_0_0EXFacebook accessTokenNativeToJSON:result.token]];
        accessToken[@"type"] = @"success";
        resolve(accessToken);
      }];
    } @catch (NSException *exception) {
      NSError *error = [[NSError alloc] initWithDomain:ABI45_0_0EXFacebookLoginErrorDomain code:650 userInfo:@{
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

ABI45_0_0EX_EXPORT_METHOD_AS(logEventAsync,
                    logEvent:(NSString *)eventName
                    valueToSum:(nonnull NSNumber *)valueToSum
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logEvent:eventName
                valueToSum:valueToSum
                parameters:parameters
               accessToken:nil];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(logPurchaseAsync,
                    logPurchase:(NSNumber *)purchaseAmount
                    currency:(NSString *)currency
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logPurchase:[purchaseAmount doubleValue]
                     currency:currency
                   parameters:parameters
                  accessToken:nil];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(logPushNotificationOpenAsync,
                    logPushNotificationOpen:(NSString *)campaign
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary *payload = @{
    FBSDKAppEventsPushPayloadKey: @{
      FBSDKAppEventsPushPayloadCampaignKey: campaign
    }
  };
  [FBSDKAppEvents logPushNotificationOpen:payload];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(setUserIDAsync,
                    setUserID:(NSString *)userID
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setUserID:userID];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(getUserIDAsync,
                    getUserID:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  resolve([FBSDKAppEvents userID]);
}

ABI45_0_0EX_EXPORT_METHOD_AS(getAnonymousIDAsync,
                    getAnonymousID:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  @try {
    NSString *anonymousID = [FBSDKAppEvents anonymousID];
    resolve(anonymousID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ANONYMOUS_ID", @"Can not get anonymousID", error);
  }
}

ABI45_0_0EX_EXPORT_METHOD_AS(getAdvertiserIDAsync,
                    getAdvertiserID:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  @try {
    NSString *advertiserID = [FBSDKAppEventsUtility advertiserID];
    resolve(advertiserID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ADVERTISER_ID", @"Can not get advertiserID", error);
  }
}

ABI45_0_0EX_EXPORT_METHOD_AS(setUserDataAsync,
                    setUserData:(NSDictionary *)userData
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
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

ABI45_0_0EX_EXPORT_METHOD_AS(setFlushBehaviorAsync,
                    setFlushBehavior:(FBSDKAppEventsFlushBehavior)flushBehavior
                    resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setFlushBehavior:flushBehavior];
  resolve(nil);
}

ABI45_0_0EX_EXPORT_METHOD_AS(flushAsync,
                    flush:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
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
