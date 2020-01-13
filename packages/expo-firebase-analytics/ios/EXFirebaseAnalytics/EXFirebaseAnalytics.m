// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilities.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics+JSON.h>
#import <UIKit/UIKit.h>
#import <Firebase/Firebase.h>

@implementation EXFirebaseAnalytics

UM_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)reject:(UMPromiseRejectBlock)reject withException:(NSException *)exception {
  NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:4815162342 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

# pragma mark - Firebase App methods


UM_EXPORT_METHOD_AS(initializeAppDangerously,
                    initializeAppDangerously:(NSDictionary *)config
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  [UMUtilities performSynchronouslyOnMainThread:^{
    FIRApp *existingApp = [FIRApp defaultApp];
    if (existingApp && (![config[@"apiKey"] isEqualToString:existingApp.options.APIKey] ||
                        ![config[@"appId"] isEqualToString:existingApp.options.googleAppID])) {
      [existingApp deleteApp:^(BOOL success) {
        [self initApp:config resolver:resolve rejecter:reject];
      }];
      
    } else {
      [self initApp:config resolver:resolve rejecter:reject];
    }
  }];
}

- (void)initApp:(NSDictionary *)options
       resolver:(UMPromiseResolveBlock)resolve
       rejecter:(UMPromiseRejectBlock)reject
{
  [UMUtilities performSynchronouslyOnMainThread:^{
    FIRApp *existingApp = [FIRApp defaultApp];
    
    if (!existingApp) {
      FIROptions *firOptions = [EXFirebaseAnalytics firOptionsJSONToNative:options];
      if (firOptions == nil) {
          reject(@"ERR_FIREBASE_ANALYTICS", @"Failed to convert nil options to FIROptions.", nil);
          return;
      }
      
      firOptions.bundleID = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"];
           
      [FIRApp configureWithOptions:firOptions];
    }
    
    resolve(@{@"result": @"success"});
  }];
}

UM_EXPORT_METHOD_AS(deleteApp,
                    deleteApp:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  FIRApp *existingApp = [FIRApp defaultApp];
  
  if (!existingApp) {
    resolve([NSNull null]);
    return;
  }
  
  [existingApp deleteApp:^(BOOL success) {
    if (success) {
      resolve([NSNull null]);
    } else {
      reject(@"ERR_FIREBASE_ANALYTICS", @"Failed to delete the Firebase app.", nil);
    }
  }];
}

- (nullable FIRApp *)getAppOrReject:(UMPromiseRejectBlock)reject
{
  FIRApp *app = [FIRApp defaultApp];
  if (app != nil) return app;
  reject(@"ERR_FIREBASE_ANALYTICS", @"The 'default' Firebase app is not initialized. Ensure your app has a valid GoogleService-Info.plist bundled and your project has react-native-unimodules installed. Optionally in the Expo client you can initialized the default app with initializeAppDangerously().", nil);
  return nil;
}

# pragma mark - Firebase Analytics methods

UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics logEventWithName:name parameters:parameters];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

UM_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

UM_EXPORT_METHOD_AS(setCurrentScreen,
                    setCurrentScreen:(NSString *)screenName
                    screenClass:(NSString *)screenClassOverview
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  [UMUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setScreenName:screenName screenClass:screenClassOverview];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
      [self reject:reject withException:exception];
      return;
    }
  }];
}

UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

UM_EXPORT_METHOD_AS(setUserProperty,
                    setUserProperty:(NSString *)name
                    value:(NSString *)value
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics setUserPropertyString:value forName:name];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

UM_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  if ([self getAppOrReject:reject] == nil) return;
  @try {
    [FIRAnalytics resetAnalyticsData];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self reject:reject withException:exception];
    return;
  }
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *constants = [NSMutableDictionary new];

  FIROptions *defaultOptions = [FIROptions defaultOptions];
  if (defaultOptions != nil) {
    constants[@"app"] = [EXFirebaseAnalytics firOptionsNativeToJSON:defaultOptions];
  }

  return constants;
}

@end
