// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI37_0_0EXFacebook/ABI37_0_0EXFacebook.h>)
#import "ABI37_0_0EXScopedFacebook.h"
#import <FBSDKCoreKit/FBSDKSettings.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleService.h>
#import <FBSDKCoreKit/FBSDKApplicationDelegate.h>

@interface ABI37_0_0EXFacebook (ExportedMethods)

- (void)initializeWithAppId:(NSString *)appId
                    appName:(NSString *)appName
                   resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                   rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config
                                  resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                                  rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (void)setAutoInitEnabled:(BOOL)enabled
                  resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                  rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

@end

static NSString *AUTO_INIT_KEY = @"autoInitEnabled";

@interface ABI37_0_0EXScopedFacebook ()

@property (nonatomic, assign) BOOL isInitialized;
@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSString *displayName;
@property (nonatomic, strong) NSUserDefaults *settings;

@end

// Expo client-only ABI37_0_0EXFacebook module, which ensures that Facebook SDK configurations
// of different experiences don't collide.

@implementation ABI37_0_0EXScopedFacebook : ABI37_0_0EXFacebook

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSString *suiteName = [NSString stringWithFormat:@"%@#%@", NSStringFromClass(self.class), experienceId];
    _settings = [[NSUserDefaults alloc] initWithSuiteName:suiteName];

    BOOL hasPreviouslySetAutoInitEnabled = [_settings boolForKey:AUTO_INIT_KEY];
    BOOL manifestDefinesAutoInitEnabled = [params[@"manifest"][@"facebookAutoInitEnabled"] boolValue];

    NSString *facebookAppId = params[@"manifest"][@"facebookAppId"];
    NSString *facebookDisplayName = params[@"manifest"][@"facebookDisplayName"];

    if (hasPreviouslySetAutoInitEnabled || manifestDefinesAutoInitEnabled) {
      // FacebookAppId is a prerequisite for initialization.
      // This happens even before the app foregrounds, which mimics
      // the mechanism behind ABI37_0_0EXFacebookAppDelegate.
      if (facebookAppId) {
        [FBSDKSettings setAppID:facebookAppId];
        [FBSDKSettings setDisplayName:facebookDisplayName];
        [FBSDKApplicationDelegate initializeSDK:nil];
        _isInitialized = YES;
      } else {
        ABI37_0_0UMLogWarn(@"FacebookAutoInit is enabled, but no FacebookAppId has been provided. Facebook SDK initialization aborted.");
      }
    }
  }
  return self;
}

- (void)initializeWithAppId:(NSString *)appId
                    appName:(NSString *)appName
                   resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                   rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  _isInitialized = YES;
  [super initializeWithAppId:appId appName:appName resolver:resolve rejecter:reject];
}

- (void)setAutoInitEnabled:(BOOL)enabled resolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  if (enabled) {
    [_settings setBool:enabled forKey:AUTO_INIT_KEY];
    // Facebook SDK on iOS is initialized when `setAutoInitEnabled` is called with `YES`.
    _isInitialized = YES;
  }
  [super setAutoInitEnabled:enabled resolver:resolve rejecter:reject];
}

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config resolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  // If the developer didn't initialize the SDK, let them know.
  if (!_isInitialized) {
    reject(@"E_NO_INIT", @"Facebook SDK has not been initialized yet.", nil);
    return;
  }
  [super logInWithReadPermissionsWithConfig:config resolver:resolve rejecter:reject];
}

# pragma mark - ABI37_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  id<ABI37_0_0UMAppLifecycleService> appLifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAppLifecycleService)];
  [appLifecycleService registerAppLifecycleListener:self];
}

# pragma mark - ABI37_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {
  // Save SDK settings state
  _appId = [FBSDKSettings appID];
  _displayName = [FBSDKSettings displayName];
  [FBSDKSettings setAppID:nil];
  [FBSDKSettings setDisplayName:nil];
}

- (void)onAppForegrounded {
  // Restore SDK settings state
  if (_appId) {
    [FBSDKSettings setAppID:_appId];
  }
  if (_displayName) {
    [FBSDKSettings setDisplayName:_displayName];
  }
}

@end
#endif
