// Copyright 2018-present 650 Industries. All rights reserved.
#import <UMCore/UMUtilities.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <Firebase/Firebase.h>

static NSString *const DEFAULT_APP_DISPLAY_NAME = @"[DEFAULT]";
static NSString *const DEFAULT_APP_NAME = @"__FIRAPP_DEFAULT";

@implementation EXFirebaseAnalytics

UM_EXPORT_MODULE(ExpoFirebaseAnalytics);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)rejectException:(UMPromiseRejectBlock)reject exception:(NSException *)exception {
    NSError *error = [NSError errorWithDomain:@"ERR_FIREBASE_ANALYTICS" code:4815162342 userInfo:@{
        @"message": exception.reason,
        @"code": exception.name,
    }];
  reject(exception.name, exception.reason, error);
}

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
      FIROptions *firOptions = [[FIROptions alloc] initWithGoogleAppID:options[@"appId"] GCMSenderID:options[@"messagingSenderId"]];
      
      firOptions.APIKey = options[@"apiKey"];
      firOptions.projectID = options[@"projectId"];
      firOptions.clientID = options[@"clientId"];
      firOptions.trackingID = options[@"trackingId"];
      firOptions.databaseURL = options[@"databaseURL"];
      firOptions.storageBucket = options[@"storageBucket"];
      firOptions.androidClientID = options[@"androidClientId"];
      firOptions.deepLinkURLScheme = options[@"deepLinkURLScheme"];
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

/*** firebase */

UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)name
                    parameters:(NSDictionary *)parameters
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  @try {
    [FIRAnalytics logEventWithName:name parameters:parameters];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self rejectException:reject exception:exception];
    return;
  }
}
UM_EXPORT_METHOD_AS(setAnalyticsCollectionEnabled,
                    setAnalyticsCollectionEnabled:(BOOL)isEnabled
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  @try {
    [FIRAnalytics setAnalyticsCollectionEnabled:isEnabled];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self rejectException:reject exception:exception];
    return;
  }
}
UM_EXPORT_METHOD_AS(setCurrentScreen,
                    setCurrentScreen:(NSString *)screenName
                    screenClass:(NSString *)screenClassOverview
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  [UMUtilities performSynchronouslyOnMainThread:^{
    @try {
      [FIRAnalytics setScreenName:screenName screenClass:screenClassOverview];
      resolve([NSNull null]);
    } @catch (NSException *exception) {
    [self rejectException:reject exception:exception];
      return;
    }
  }];
}
UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  @try {
    [FIRAnalytics setUserID:userId];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
      [self rejectException:reject exception:exception];
    return;
  }
}
UM_EXPORT_METHOD_AS(setUserProperty,
                    setUserProperty:(NSString *)name
                    value:(NSString *)value
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  @try {
    [FIRAnalytics setUserPropertyString:value forName:name];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
      [self rejectException:reject exception:exception];
    return;
  }
}
UM_EXPORT_METHOD_AS(resetAnalyticsData,
                    resetAnalyticsData:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  @try {
    [FIRAnalytics resetAnalyticsData];
    resolve([NSNull null]);
  } @catch (NSException *exception) {
    [self rejectException:reject exception:exception];
    return;
  }
}

- (NSDictionary *)convertFirOptionsToDictionary:(FIROptions *)firOptions
{
  return @{
    @"androidClientID": firOptions.androidClientID,
    @"apiKey": firOptions.APIKey,
    @"appId": firOptions.googleAppID,
    @"clientId": firOptions.clientID,
    @"databaseURL": firOptions.databaseURL,
    @"deepLinkUrlScheme": firOptions.deepLinkURLScheme,
    @"messagingSenderId": firOptions.GCMSenderID,
    @"projectId": firOptions.projectID,
    @"storageBucket": firOptions.storageBucket,
    @"trackingId": firOptions.trackingID,
  };
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *constants = [NSMutableDictionary new];

  FIROptions *defaultOptions = [FIROptions defaultOptions];
  if (defaultOptions != nil) {
    constants[@"app"] = [self convertFirOptionsToDictionary:defaultOptions];
  }
    
  return constants;
}

@end
