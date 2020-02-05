// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
#import "EXScopedFirebaseCore.h"
#import <EXFirebaseCore/EXFirebaseCore+FIROptions.h>

#define EXPO_CLIENT_APP_NAME @"__FIRAPP_EXPO_CLIENT"

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@implementation EXScopedFirebaseCore {
  NSDictionary* _protectedAppNames;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (![@"expo" isEqualToString:constantsBinding.appOwnership]) {
    return [super init];
  }

  // Setup the protected app names
  NSMutableDictionary* protectedAppNames = [NSMutableDictionary dictionaryWithDictionary:@{
    //EXPO_CLIENT_APP_NAME: @YES,
    @"__FIRAPP_DEFAULT": @YES,
    @"[DEFAULT]": @YES
  }];
  _protectedAppNames = protectedAppNames;
  
  // Determine project app name & options
  NSString *encodedExperienceId = [self.class encodedResourceName:experienceId];
  //NSString* appName = [NSString stringWithFormat:@"__sandbox_%@", encodedExperienceId];
  NSString* appName = @"__FIRAPP_DEFAULT";
  NSDictionary* googleServicesFile = [self.class googleServicesFileFromConstantsManifest:constantsBinding];
  FIROptions* options = [self.class optionsWithGoogleServicesFile:googleServicesFile];
  
  // Make sure the [DEFAULT] app is initialized on the Expo client
  /*NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (path && ![FIRApp defaultApp]) {
    [FIRApp configure];
  }
  if ([FIRApp defaultApp]) [protectedAppNames setValue:@YES forKey:[FIRApp defaultApp].name];*/
  
  // Initialize the EXPO_CLIENT app. It is important to not use the "DEFAULT" app
  // for the expo client, as this triggers all kinds of "special" initialisation
  // in the firebase SDK. A good example of this is Analytics, which is a singleton
  // and is automatically initialized when the default app is created. By not using
  // the "DEFAULT" app, the possibility of controlling and updating these singleton services
  // is made possible.
  /*NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (path) {
    FIRApp* app = [FIRApp appNamed:EXPO_CLIENT_APP_NAME];
    if (!app) {
      [FIRApp configureWithName:EXPO_CLIENT_APP_NAME options:[FIROptions defaultOptions]];
    }
  }*/
  
 
  

  // Configure the analytics singleton to use project firebase options
  [self.class configureAnalyticsWithOptions:options];
  
  // Delete all previously created (project) apps, except for the currently
  // loaded project and the "protected" ones
  NSDictionary<NSString *,FIRApp *>* apps = [FIRApp allApps];
  NSArray<NSString*>* names = [apps allKeys];
  for (int i = 0; i < names.count; i++) {
    NSString* name = names[i];
    if (!protectedAppNames[name] && (!options || ![name isEqualToString:appName])) {
      [[FIRApp appNamed:name] deleteApp:^(BOOL success) {
        if (!success) {
          NSLog(@"Failed to delete Firebase app: %@", name);
        } else {
          NSLog(@"Deleted Firebase app: %@", name);
        }
      }];
    }
  }

  // Initialize the sandboxed firebase app
  return [super initWithAppName:appName options:options];
}

# pragma mark - Overriden methods

- (BOOL) isAppAccessible:(nonnull NSString*)name
{
  // Deny access to the protected default app on the Expo client
  if (_protectedAppNames && _protectedAppNames[name]) {
    return NO;
  }
  return [super isAppAccessible:name];
}


# pragma mark - Project methods

+ (NSString *)encodedResourceName:(NSString *)name
{
  NSData *data = [name dataUsingEncoding:NSUTF8StringEncoding];
  NSString *base64 = [data base64EncodedStringWithOptions:kNilOptions];
  return [base64 stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"="]];
}

+ (nullable NSDictionary*)googleServicesFileFromConstantsManifest:(nullable id<UMConstantsInterface>)constants
{
  // load GoogleService-Info.plist from manifest
  if (constants == nil) return nil;
  NSDictionary* manifest = constants.constants[@"manifest"];
  NSDictionary* ios = manifest ? manifest[@"ios"] : nil;
  NSString* googleServicesFile = ios ? ios[@"googleServicesFile"] : nil;
  if (!googleServicesFile) return nil;
  NSData *data = [[NSData alloc] initWithBase64EncodedString:googleServicesFile options:0];
  NSError* error;
  NSDictionary* plist = [NSPropertyListSerialization propertyListWithData:data options:NSPropertyListImmutable format:nil error:&error];
  if (error) NSLog(@"Invalid googleServicesFile: %@", error);
  return plist;
}

+ (nullable FIROptions*) optionsWithGoogleServicesFile:(nullable NSDictionary*)plist
{
  if (!plist) return nil;
  
  FIROptions *firOptions = [[FIROptions alloc] initWithGoogleAppID:plist[@"GOOGLE_APP_ID"] GCMSenderID:plist[@"GCM_SENDER_ID"]];
         
  firOptions.APIKey = plist[@"API_KEY"];
  firOptions.bundleID = plist[@"BUNDLE_ID"];
  firOptions.clientID = plist[@"CLIENT_ID"];
  firOptions.trackingID = plist[@"TRACKING_ID"];
  firOptions.projectID = plist[@"PROJECT_ID"];
  firOptions.androidClientID = plist[@"ANDROID_CLIENT_ID"];
  firOptions.databaseURL = plist[@"DATABASE_URL"];
  //firOptions.deepLinkURLScheme = plist[@"DEEP_LINK_URL_SCHEMA"];
  firOptions.storageBucket = plist[@"STORAGE_BUCKET"];
  //firOptions.appGroupID = plist[@"APP_GROUP_ID"];
  
  return firOptions;
}


# pragma mark - Analytics methods

+ (void) configureAnalyticsWithOptions:(nullable FIROptions*) options
{
  static FIROptions *analyticsOptions = nil;
  /*static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    analyticsOptions = [FIROptions defaultOptions];
  });*/
  
  // When the same project was re-loaded, don't update analytics
  if ([self.class firOptionsIsEqualTo:options compareTo:analyticsOptions]) {
    return;
  }
  
  // Stop analytics when previously initialized
  if (analyticsOptions) {
    //[FIRAnalytics setAnalyticsCollectionEnabled:NO];
    //[self.class stopAnalytics];
  }
  
  // (re-)Initialize analytics
  /*if (options) {
    [self.class startAnalyticsWithOptions:options];
  }*/
  analyticsOptions = options;
}

+ (void) stopAnalytics
{
  [FIRAnalytics resetAnalyticsData];
}

+ (void) startAnalyticsWithOptions:(nonnull FIROptions*)options
{
  Class firAnalyticsClass = NSClassFromString(@"FIRAnalytics");
  if (!firAnalyticsClass) return;
  
  NSLog(@"%@", [firAnalyticsClass performSelector:@selector(_methodDescription)]);
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  SEL startWithConfigurationSelector = @selector(startWithConfiguration:options:);
  SEL analyticsConfigurationSelector = @selector(analyticsConfiguration);
#pragma clang diagnostic pop
  if ([firAnalyticsClass respondsToSelector:startWithConfigurationSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [firAnalyticsClass performSelector:startWithConfigurationSelector
                            withObject:[[FIRConfiguration sharedInstance] performSelector:analyticsConfigurationSelector]
                            withObject:options];
#pragma clang diagnostic pop
  }
}

@end
#endif
