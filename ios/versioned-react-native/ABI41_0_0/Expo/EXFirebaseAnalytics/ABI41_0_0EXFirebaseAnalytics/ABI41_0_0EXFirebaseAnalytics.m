// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>
#import <ABI41_0_0EXFirebaseCore/ABI41_0_0UMFirebaseCoreInterface.h>
#import <ABI41_0_0EXFirebaseAnalytics/ABI41_0_0EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@interface ABI41_0_0EXFirebaseAnalytics ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMFirebaseCoreInterface> firebaseCore;

@end

@implementation ABI41_0_0EXFirebaseAnalytics

ABI41_0_0UM_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)reject:(ABI41_0_0UMPromiseRejectBlock)reject withException:(NSException *)exception {
  NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:0 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _firebaseCore = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMFirebaseCoreInterface)];
}

- (nullable FIRApp *)getAppOrReject:(ABI41_0_0UMPromiseRejectBlock)reject
{
  if (!_firebaseCore) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"ABI41_0_0EXFirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has ABI41_0_0React-native-unimodules installed.", nil);
    return nil;
  }
  FIRApp *defaultApp = [_firebaseCore defaultApp];
  if (!defaultApp) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"Firebase app is not initialized. Ensure your app has a valid GoogleService-Info.plist bundled.", nil);
    return nil;
  }
  FIRApp *systemApp = [FIRApp defaultApp];
  if (!systemApp || ![systemApp.name isEqualToString:defaultApp.name]) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"Analytics events can only be logged for the default app.", nil);
    return nil;
  }
  return defaultApp;
}

# pragma mark - Firebase Analytics methods

ABI41_0_0UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics logEventWithName:name parameters:parameters];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(setCurrentScreen,
                    setCurrentScreen:(NSString *)screenName
                    screenClass:(NSString *)screenClassOverview
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setScreenName:screenName screenClass:screenClassOverview];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
      [self reject:reject withException:exception];
      return;
    }
  }];
}

ABI41_0_0UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(setUserProperties, 
                    setUserProperties:(NSDictionary *)properties 
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve 
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [properties enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
      [FIRAnalytics setUserPropertyString:value forName:key];
    }];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI41_0_0UM_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics resetAnalyticsData];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

@end
