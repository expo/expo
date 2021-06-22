// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebook.h>
#import <EXFacebook/EXFacebookAppTrackingPermissionRequester.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKCoreKit/FBSDKAppEventsUtility.h>

NSString * const EXFacebookMisconfiguredErrorDomain = @"ERR_FACEBOOK_MISCONFIGURED";
NSString * const EXFacebookLoginErrorDomain = @"ERR_FACEBOOK_LOGIN";
static NSString *const FBSDKAppEventsPushPayloadKey = @"fb_push_payload";
static NSString *const FBSDKAppEventsPushPayloadCampaignKey = @"campaign";

@interface EXFacebook ()

@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;

@end

@implementation EXFacebook

UM_EXPORT_MODULE(ExponentFacebook)

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[[EXFacebookAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXFacebookAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXFacebookAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

UM_EXPORT_METHOD_AS(setAdvertiserTrackingEnabledAsync,
                    setAdvertiserTrackingEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  BOOL result = [FBSDKSettings setAdvertiserTrackingEnabled:enabled];
  resolve(@(result));
}

UM_EXPORT_METHOD_AS(setAutoLogAppEventsEnabledAsync,
                    setAutoLogAppEventsEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [FBSDKSettings setAutoLogAppEventsEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(initializeAsync,
                    initializeAsync:(NSDictionary *)options
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  if (options[@"appId"]) {
    [FBSDKSettings setAppID:options[@"appId"]];
  }
  if (![FBSDKSettings appID]) {
    reject(EXFacebookMisconfiguredErrorDomain, @"No FacebookAppId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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

UM_EXPORT_METHOD_AS(setAdvertiserIDCollectionEnabledAsync,
                    setAdvertiserIDCollectionEnabled:(BOOL)enabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // Caller overrides buildtime settings
  [FBSDKSettings setAdvertiserIDCollectionEnabled:enabled];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logOutAsync,
                    logOutAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  FBSDKLoginManager *loginManager = [[FBSDKLoginManager alloc] init];
  [loginManager logOut];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(getAuthenticationCredentialAsync,
                    getAuthenticationCredentialAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  FBSDKAccessToken *currentAccessToken = [FBSDKAccessToken currentAccessToken];
  resolve(UMNullIfNil([EXFacebook accessTokenNativeToJSON:currentAccessToken]));
}

UM_EXPORT_METHOD_AS(logInWithReadPermissionsAsync,
                    logInWithReadPermissionsWithConfig:(NSDictionary *)config
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (![FBSDKSettings appID]) {
    reject(EXFacebookMisconfiguredErrorDomain, @"No appId configured, required for initialization. Please ensure that you're either providing `appId` to `initializeAsync` as an argument or inside Info.plist.", nil);
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
          reject(EXFacebookLoginErrorDomain, @"Error with Facebook login", error);
          return;
        }
        
        if (result.isCancelled || !result.token) {
          resolve(@{ @"type": @"cancel" });
          return;
        }
        
        NSMutableDictionary *accessToken = [NSMutableDictionary dictionaryWithDictionary:[EXFacebook accessTokenNativeToJSON:result.token]];
        accessToken[@"type"] = @"success";
        resolve(accessToken);
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

UM_EXPORT_METHOD_AS(logEventAsync,
                    logEvent:(NSString *)eventName
                    valueToSum:(nonnull NSNumber *)valueToSum
                    parameters:(NSDictionary *)parameters
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logEvent:eventName
                valueToSum:valueToSum
                parameters:parameters
               accessToken:nil];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logPurchaseAsync,
                    logPurchase:(NSNumber *)purchaseAmount
                    currency:(NSString *)currency
                    parameters:(NSDictionary *)parameters
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  parameters = dictionaryWithNullValuesAsStrings(parameters);
  
  [FBSDKAppEvents logPurchase:[purchaseAmount doubleValue]
                     currency:currency
                   parameters:parameters
                  accessToken:nil];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logPushNotificationOpenAsync,
                    logPushNotificationOpen:(NSString *)campaign
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSDictionary *payload = @{
    FBSDKAppEventsPushPayloadKey: @{
      FBSDKAppEventsPushPayloadCampaignKey: campaign
    }
  };
  [FBSDKAppEvents logPushNotificationOpen:payload];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setUserIDAsync,
                    setUserID:(NSString *)userID
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setUserID:userID];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(getUserIDAsync,
                    getUserID:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([FBSDKAppEvents userID]);
}

UM_EXPORT_METHOD_AS(getAnonymousIDAsync,
                    getAnonymousID:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  @try {
    NSString *anonymousID = [FBSDKAppEvents anonymousID];
    resolve(anonymousID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ANONYMOUS_ID", @"Can not get anonymousID", error);
  }
}

UM_EXPORT_METHOD_AS(getAdvertiserIDAsync,
                    getAdvertiserID:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  @try {
    NSString *advertiserID = [FBSDKAppEventsUtility advertiserID];
    resolve(advertiserID);
  }
  @catch (NSError *error) {
    reject(@"ERR_FACEBOOK_ADVERTISER_ID", @"Can not get advertiserID", error);
  }
}

UM_EXPORT_METHOD_AS(setUserDataAsync,
                    setUserData:(NSDictionary *)userData
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(setFlushBehaviorAsync,
                    setFlushBehavior:(FBSDKAppEventsFlushBehavior)flushBehavior
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [FBSDKAppEvents setFlushBehavior:flushBehavior];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(flushAsync,
                    flush:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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
