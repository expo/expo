// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
#import "EXScopedFirebaseCore.h"

@implementation EXScopedFirebaseCore {
  NSString* _protectedAppName;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (![@"expo" isEqualToString:constantsBinding.appOwnership]) {
    return [super init];
  }

  // Make sure the [DEFAULT] app is initialized on the Expo client
  NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (path && ![FIRApp defaultApp]) {
    [FIRApp configure];
  }
  FIRApp* defaultApp = [FIRApp defaultApp];
  _protectedAppName = defaultApp ? defaultApp.name : @"__FIRAPP_DEFAULT";
 
  // Determine app name & options
  NSString *encodedExperienceId = [self.class encodedResourceName:experienceId];
  NSString* appName = [NSString stringWithFormat:@"__sandbox_%@", encodedExperienceId];
  NSDictionary* googleServicesFile = [self.class googleServicesFileFromConstantsManifest:constantsBinding];
  FIROptions* options = [self.class optionsWithGoogleServicesFile:googleServicesFile];

  // Delete all previously created apps, except for the "default" one
  // which will be updated/created/deleted only when it has changed
  NSDictionary<NSString *,FIRApp *>* apps = [FIRApp allApps];
  NSArray<NSString*>* names = [apps allKeys];
  for (int i = 0; i < names.count; i++) {
    NSString* name = names[i];
    if (![name isEqualToString:appName] && ![name isEqualToString:_protectedAppName]) {
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

+ (NSString *)encodedResourceName:(NSString *)name
{
  NSData *data = [name dataUsingEncoding:NSUTF8StringEncoding];
  NSString *base64 = [data base64EncodedStringWithOptions:kNilOptions];
  return [base64 stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"="]];
}

- (BOOL) isAppAccessible:(nonnull NSString*)name
{
  // Deny access to the protected default app on the Expo client
  if ((_protectedAppName && [name isEqualToString:_protectedAppName]) ||
    [name isEqualToString:@"[DEFAULT]"]) {
    return NO;
  }
  return [super isAppAccessible:name];
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
  return plist;
}

+ (nullable FIROptions*) optionsWithGoogleServicesFile:(nullable NSDictionary*)plist
{
  if (!plist) return nil;
  
  FIROptions *firOptions = [[FIROptions alloc] initWithGoogleAppID:plist[@"GOOGLE_APP_ID"] GCMSenderID:plist[@"GCM_SENDER_ID"]];
         
  firOptions.APIKey = plist[@"API_KEY"];
  firOptions.projectID = plist[@"PROJECT_ID"];
  firOptions.clientID = plist[@"CLIENT_ID"];
  firOptions.databaseURL = plist[@"DATABASE_URL"];
  firOptions.storageBucket = plist[@"STORAGE_BUCKET"];
  //firOptions.trackingID = plist[@"trackingId"];
  //firOptions.androidClientID = plist[@"ANDROID_CLIENT_ID"];
  //firOptions.deepLinkURLScheme = plist[@"DEEP_LINK_URL_SCHEMA"];
  
  return firOptions;
}

@end
#endif
