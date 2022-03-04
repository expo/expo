// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXUtilities.h>
#import <EXFirebaseCore/EXFirebaseCoreInterface.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@interface EXFirebaseAnalytics ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXFirebaseCoreInterface> firebaseCore;

@end

@implementation EXFirebaseAnalytics

EX_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)reject:(EXPromiseRejectBlock)reject withException:(NSException *)exception {
  NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:0 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _firebaseCore = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFirebaseCoreInterface)];
}

- (nullable FIRApp *)getAppOrReject:(EXPromiseRejectBlock)reject
{
  if (!_firebaseCore) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"EXFirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has react-native-unimodules installed.", nil);
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

EX_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics logEventWithName:name parameters:[self cleanJavascriptParams:parameters]];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

EX_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

EX_EXPORT_METHOD_AS(setSessionTimeoutDuration,
                    setSessionTimeoutDuration:(NSNumber *)milliseconds
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  [EXUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setSessionTimeoutInterval:[milliseconds doubleValue] / 1000.0];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
      [self reject:reject withException:exception];
      return;
    }
  }];
}

EX_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

EX_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
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

EX_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics resetAnalyticsData];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

#pragma mark -
#pragma mark Private methods

- (NSDictionary *)cleanJavascriptParams:(NSDictionary *)params {
  NSMutableDictionary *newParams = [params mutableCopy];
  if (newParams[kFIRParameterItems]) {
    NSMutableArray *newItems = [NSMutableArray array];
    [(NSArray *)newParams[kFIRParameterItems]
        enumerateObjectsUsingBlock:^(id _Nonnull obj, NSUInteger idx, BOOL *_Nonnull stop) {
          NSMutableDictionary *item = [obj mutableCopy];
          if (item[kFIRParameterQuantity]) {
            item[kFIRParameterQuantity] = @([item[kFIRParameterQuantity] integerValue]);
          }
          [newItems addObject:[item copy]];
        }];
    newParams[kFIRParameterItems] = [newItems copy];
  }
  NSNumber *extendSession = [newParams valueForKey:kFIRParameterExtendSession];
  if ([extendSession isEqualToNumber:@1]) {
    newParams[kFIRParameterExtendSession] = @YES;
  }
  return [newParams copy];
}

@end
