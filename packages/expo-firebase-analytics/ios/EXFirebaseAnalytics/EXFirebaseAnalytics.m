// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilities.h>
#import <EXFirebaseCore/UMFirebaseCoreInterface.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics.h>
#import <UIKit/UIKit.h>
#import <Firebase/Firebase.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@interface EXFirebaseAnalytics ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMFirebaseCoreInterface> firebaseCore;

@end

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

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _firebaseCore = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFirebaseCoreInterface)];
  //_firebaseCore = (EXFirebaseCore*) [moduleRegistry getExportedModuleOfClass:[EXFirebaseCore class]];


  NSLog(@"%@", [[FIRConfiguration sharedInstance] performSelector:@selector(_methodDescription)]);
  
  Class firAnalyticsClass = NSClassFromString(@"FIRAnalytics");
  if (firAnalyticsClass) {
    NSLog(@"%@", [firAnalyticsClass performSelector:@selector(_methodDescription)]);
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wundeclared-selector"
    SEL startWithConfigurationSelector = @selector(startWithConfiguration:options:);
    SEL analyticsConfigurationSelector = @selector(analyticsConfiguration);
    //SEL addLogEventListenerSelector = @selector(addLogEventListener:);
  #pragma clang diagnostic pop
    //if ([firAnalyticsClass respondsToSelector:addLogEventListenerSelector]) {
    if ([firAnalyticsClass respondsToSelector:startWithConfigurationSelector]) {
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  #pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [firAnalyticsClass performSelector:startWithConfigurationSelector
                              withObject:[[FIRConfiguration sharedInstance] performSelector:analyticsConfigurationSelector]
                              withObject:_firebaseCore.defaultApp.options];
    /*[firAnalyticsClass performSelector:addLogEventListenerSelector
                            withObject:^(NSObject* arg) {
      NSLog(@"log: %@", arg, nil);
    }];*/
      
  #pragma clang diagnostic pop
    }
  }
  
  //[firAnalyticsClass performSelector:@selector(addLogEventListener)]
  //+ (id) addLogEventListener:(^block)arg1; (0x10615b593)
  
}


# pragma mark - Firebase App methods


/*UM_EXPORT_METHOD_AS(initializeAppDangerously,
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
}*/

/*- (void)initApp:(NSDictionary *)options
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
}*/

- (nullable FIRApp *)getAppOrReject:(UMPromiseRejectBlock)reject
{
  if (!_firebaseCore) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"EXFirebaseCore could not be found. Ensure that your app has correctly linked 'expo-firebase-core' and your project has react-native-unimodules installed.", nil);
    return nil;
  }
  FIRApp* defaultApp = [_firebaseCore defaultApp];
  FIRApp* systemApp = [FIRApp defaultApp];
  if (!defaultApp || !systemApp) {
    // TODO - add error message for Expo client
    reject(@"ERR_FIREBASE_ANALYTICS", @"The 'default' Firebase app is not initialized. Ensure your app has a valid GoogleService-Info.plist bundled.", nil);
    return nil;
  }
  NSString* trackingId = defaultApp.options.trackingID;
  /*if (!trackingId || ![trackingId isEqualToString:systemApp.options.trackingID]) {
    reject(@"ERR_FIREBASE_ANALYTICS", @"No 'TRACKING_ID' has been configured in GoogleService-Info.plist. Ensure that analytics is setup correctly for your Firebase project.", nil);
    return nil;
  }*/
  return defaultApp;
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

UM_EXPORT_METHOD_AS(setUserProperties, 
                    setUserProperties:(NSDictionary *)properties 
                    resolver:(UMPromiseResolveBlock)resolve 
                    rejecter:(UMPromiseRejectBlock)reject) {
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

@end
