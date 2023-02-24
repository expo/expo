// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0EXFirebaseCore/ABI47_0_0EXFirebaseCoreInterface.h>
#import <ABI47_0_0EXFirebaseAnalytics/ABI47_0_0EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@interface ABI47_0_0EXFirebaseAnalytics ()

@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI47_0_0EXFirebaseCoreInterface> firebaseCore;

@end

@implementation ABI47_0_0EXFirebaseAnalytics

ABI47_0_0EX_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)reject:(ABI47_0_0EXPromiseRejectBlock)reject withException:(NSException *)exception {
  NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:0 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _firebaseCore = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXFirebaseCoreInterface)];
}

- (nullable FIRApp *)getAppOrReject:(ABI47_0_0EXPromiseRejectBlock)reject
{
  if (!_firebaseCore) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"ABI47_0_0EXFirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has react-native-unimodules installed.", nil);
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

ABI47_0_0EX_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics logEventWithName:name parameters:parameters];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(setSessionTimeoutDuration,
                    setSessionTimeoutDuration:(NSNumber *)milliseconds
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  [ABI47_0_0EXUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setSessionTimeoutInterval:[milliseconds doubleValue] / 1000.0];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
      [self reject:reject withException:exception];
      return;
    }
  }];
}

ABI47_0_0EX_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(setUserProperties, 
                    setUserProperties:(NSDictionary *)properties 
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve 
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
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

ABI47_0_0EX_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
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
