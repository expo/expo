// Copyright 2020-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXUtilities.h>
#import <EXFirebaseCore/EXFirebaseCore.h>
#import <EXFirebaseCore/EXFirebaseCore+FIROptions.h>

static NSString * const DEFAULT_APP_NAME_IOS = @"__FIRAPP_DEFAULT";
static NSString * const DEFAULT_APP_NAME_UNIVERSAL = @"[DEFAULT]";

@interface EXFirebaseCore ()
@property (nonatomic, strong) NSString *appName;
@property (nonatomic, strong) FIROptions *appOptions;
@end

@implementation EXFirebaseCore

EX_EXPORT_MODULE(ExpoFirebaseCore);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFirebaseCoreInterface)];
}

+ (NSString *)toUniversalAppName:(NSString *)name
{
  return [name isEqualToString:DEFAULT_APP_NAME_IOS]
  ? DEFAULT_APP_NAME_UNIVERSAL
  : name;
}

+ (NSString *)fromUniversalAppName:(NSString *)name
{
  return [name isEqualToString:DEFAULT_APP_NAME_UNIVERSAL]
  ? DEFAULT_APP_NAME_IOS
  : name;
}

- (nonnull instancetype)init
{
  // Base initialisation of the "default" Firebase App.
  // This will initialize firebase when a config exists, and when
  // Firebase hasn't already been initialized.
  if (self = [super init]) {
    _appName = DEFAULT_APP_NAME_IOS;
    NSString *path = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
    if (path && ![FIRApp defaultApp]) {
      [FIRApp configure];
    }
    FIRApp* defaultApp = [FIRApp defaultApp];
    if (defaultApp) {
      _appName = defaultApp.name;
      _appOptions = defaultApp.options;
    }
  }
  return self;
}

- (nonnull instancetype)initWithAppName:(nonnull NSString *)name options:(nullable FIROptions *)options
{
  if (self = [super init]) {
    _appName = name;
    _appOptions = options;
    
    // Initialize the firebase app. This will delete/create/update the app
    // if it has changed, and leaves the app untouched when the config
    // is the same.
    [self.class updateAppWithOptions:options name:name completion:^(BOOL success) {
      if (!success) {
        EXLogWarn(@"Failed to initialize Firebase app: %@", name);
      }
    }];
  }
  return self;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary* constants = [NSMutableDictionary dictionaryWithDictionary:@{
    @"DEFAULT_APP_NAME": [self.class toUniversalAppName:_appName]
  }];
  
  if (_appOptions) {
    [constants setObject:[self.class firOptionsToJSON:_appOptions] forKey:@"DEFAULT_APP_OPTIONS"];
  }
  
  return constants;
}

- (BOOL)isAppAccessible:(nonnull NSString *)name
{
  return YES;
}

- (nullable FIRApp *)defaultApp
{
  return [FIRApp appNamed:_appName];
}

+ (void)updateAppWithOptions:(nullable FIROptions *)options name:(nonnull NSString *)name completion:(nonnull FIRAppVoidBoolCallback)completion
{
  FIRApp* app = [FIRApp appNamed:name];
  if (!options) {
    if (app) {
      [app deleteApp:completion];
      return;
    }
  } else {
    if (app) {
      if (![self.class areFirOptions:app.options equalTo:options]) {
        [app deleteApp:^(BOOL success) {
          [FIRApp configureWithName:name options:options];
          completion(YES);
        }];
        return;
      }
    } else {
      [FIRApp configureWithName:name options:options];
    }
  }
  completion(YES);
}

@end
