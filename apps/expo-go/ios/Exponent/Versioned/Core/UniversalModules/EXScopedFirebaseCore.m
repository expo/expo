// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
#import "EXScopedFirebaseCore.h"
#import <EXFirebaseCore/EXFirebaseCore+FIROptions.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

@interface NSObject (Private)
- (NSString*)_methodDescription;
@end

@implementation EXScopedFirebaseCore {
  NSDictionary* _protectedAppNames;
}

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(EXManifestsManifest *)manifest constantsBinding:(EXConstantsBinding *)constantsBinding
{
  // Setup the protected app names
  NSMutableDictionary* protectedAppNames = [NSMutableDictionary dictionaryWithDictionary:@{
    @"__FIRAPP_DEFAULT": @YES,
    @"[DEFAULT]": @YES
  }];
  _protectedAppNames = protectedAppNames;

  // Make sure the [DEFAULT] app is initialized
  NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (path && ![FIRApp defaultApp]) {
    [FIRApp configure];
  }
  if ([FIRApp defaultApp]) [protectedAppNames setValue:@YES forKey:[FIRApp defaultApp].name];

  // Determine project app name & options
  NSString *encodedScopeKey = [self.class encodedResourceName:scopeKey];
  NSString* appName = [NSString stringWithFormat:@"__sandbox_%@", encodedScopeKey];
  NSDictionary* googleServicesFile = [self.class googleServicesFileFromManifest:manifest];
  FIROptions* options = [self.class optionsWithGoogleServicesFile:googleServicesFile];

  // Delete all previously created (project) apps, except for the currently
  // loaded project and the "protected" ones
  NSDictionary<NSString *,FIRApp *>* apps = [FIRApp allApps];
  NSArray<NSString*>* names = [apps allKeys];
  for (NSString* name in names) {
    if (!protectedAppNames[name] && (!options || ![name isEqualToString:appName])) {
      [[FIRApp appNamed:name] deleteApp:^(BOOL success) {
        if (!success) {
          EXLogWarn(@"Failed to delete Firebase app: %@", name);
        }
      }];
    }
  }

  // Initialize the sandboxed firebase app
  return [super initWithAppName:appName options:options];
}

# pragma mark - Overriden methods

- (BOOL)isAppAccessible:(nonnull NSString *)name
{
  // Deny access to the protected default app on the Expo Go
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

+ (nullable NSDictionary *)googleServicesFileFromManifest:(EXManifestsManifest *)manifest
{
  // load GoogleService-Info.plist from manifest
  @try {
    NSString* googleServicesFile = manifest.iosGoogleServicesFile;
    if (!googleServicesFile) return nil;
    NSData *data = [[NSData alloc] initWithBase64EncodedString:googleServicesFile options:0];
    NSError* error;
    NSDictionary* plist = [NSPropertyListSerialization propertyListWithData:data options:NSPropertyListImmutable format:nil error:&error];
    if (error) EXLogWarn(@"Invalid googleServicesFile: %@", error);
    return plist;
  }
  @catch(NSException* exception) {
    EXLogWarn(@"Invalid googleServicesFile: %@", exception);
    return nil;
  }
}

+ (nullable FIROptions *)optionsWithGoogleServicesFile:(nullable NSDictionary *)plist
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
  firOptions.storageBucket = plist[@"STORAGE_BUCKET"];

  return firOptions;
}

@end

#endif
