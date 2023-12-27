// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>
#import <ABI43_0_0EXFirebaseCore/ABI43_0_0EXFirebaseCoreInterface.h>
#import <ABI43_0_0EXFirebaseAnalytics/ABI43_0_0EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@interface ABI43_0_0EXFirebaseAnalytics ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI43_0_0EXFirebaseCoreInterface> firebaseCore;

@end

@implementation ABI43_0_0EXFirebaseAnalytics

ABI43_0_0EX_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)reject:(ABI43_0_0EXPromiseRejectBlock)reject withException:(NSException *)exception {
  NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:0 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _firebaseCore = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXFirebaseCoreInterface)];
}

- (nullable FIRApp *)getAppOrReject:(ABI43_0_0EXPromiseRejectBlock)reject
{
  if (!_firebaseCore) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"ABI43_0_0EXFirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has react-native-unimodules installed.", nil);
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

ABI43_0_0EX_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics logEventWithName:name parameters:parameters];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(setCurrentScreen,
                    setCurrentScreen:(NSString *)screenName
                    screenClass:(NSString *)screenClassOverview
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  [ABI43_0_0EXUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setScreenName:screenName screenClass:screenClassOverview];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
      [self reject:reject withException:exception];
      return;
    }
  }];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserProperties, 
                    setUserProperties:(NSDictionary *)properties 
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve 
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
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

ABI43_0_0EX_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject) {
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
