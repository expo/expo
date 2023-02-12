// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXFacebook/ABI47_0_0EXFacebook.h>)
#import "ABI47_0_0EXScopedFacebook.h"
#import <FBSDKCoreKit/FBSDKSettings.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleService.h>
#import <FBSDKCoreKit/FBSDKApplicationDelegate.h>

@interface ABI47_0_0EXFacebook (ExportedMethods)

- (void)initializeAsync:(NSDictionary *)options
               resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
               rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config
                                  resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                                  rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (void)logOutAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
           rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (void)getAuthenticationCredentialAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                   rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (void)setAutoInitEnabled:(BOOL)enabled
                  resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

@end

static NSString *AUTO_INIT_KEY = @"autoInitEnabled";

@interface ABI47_0_0EXScopedFacebook ()

@property (nonatomic, assign) BOOL isInitialized;
@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSString *displayName;
@property (nonatomic, strong) NSUserDefaults *settings;

@end

// Expo Go-only ABI47_0_0EXFacebook module, which ensures that Facebook SDK configurations
// of different projects don't collide.

@implementation ABI47_0_0EXScopedFacebook : ABI47_0_0EXFacebook

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI47_0_0EXManifestsManifest *)manifest
{
  if (self = [super init]) {
    NSString *suiteName = [NSString stringWithFormat:@"%@#%@", NSStringFromClass(self.class), scopeKey];
    _settings = [[NSUserDefaults alloc] initWithSuiteName:suiteName];

    BOOL hasPreviouslySetAutoInitEnabled = [_settings boolForKey:AUTO_INIT_KEY];
    BOOL manifestDefinesAutoInitEnabled = manifest.facebookAutoInitEnabled;

    NSString *scopedFacebookAppId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookAppID"];
    NSString *manifestFacebookAppId = manifest.facebookAppId;

    if (hasPreviouslySetAutoInitEnabled || manifestDefinesAutoInitEnabled) {
      // This happens even before the app foregrounds, which mimics
      // the mechanism behind ABI47_0_0EXFacebookAppDelegate.
      // Check for FacebookAppId in case this is a custom client build
      if (scopedFacebookAppId) {
        [FBSDKApplicationDelegate initializeSDK:nil];
        _isInitialized = YES;
        if (manifestFacebookAppId) {
          ABI47_0_0EXLogInfo(@"Overriding Facebook App ID with Expo Go's. To test your own Facebook App ID, you'll need to build a standalone app. Refer to our documentation for more info- https://docs.expo.io/versions/latest/sdk/facebook/");
        }
      } else {
        ABI47_0_0EXLogWarn(@"FacebookAutoInit is enabled, but no FacebookAppId has been provided. Facebook SDK initialization aborted.");
      }
    }
  }
  return self;
}

- (void)initializeAsync:(NSDictionary *)options
               resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
               rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  _isInitialized = YES;
  if (options[@"appId"]) {
    ABI47_0_0EXLogInfo(@"Overriding Facebook App ID with Expo Go's. To test your own Facebook App ID, you'll need to build a standalone app. Refer to our documentation for more info- https://docs.expo.io/versions/latest/sdk/facebook/");
  }

  NSString *scopedFacebookAppId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookAppID"];

  NSMutableDictionary *nativeOptions = [NSMutableDictionary dictionaryWithDictionary:options];
  // Overwrite the incoming app id with the Expo Facebook SDK app id.
  nativeOptions[@"appId"] = scopedFacebookAppId;

  [super initializeAsync:nativeOptions resolver:resolve rejecter:reject];
}

- (void)setAutoInitEnabled:(BOOL)enabled resolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  if (enabled) {
    [_settings setBool:enabled forKey:AUTO_INIT_KEY];
    // Facebook SDK on iOS is initialized when `setAutoInitEnabled` is called with `YES`.
    _isInitialized = YES;
  }
  [super setAutoInitEnabled:enabled resolver:resolve rejecter:reject];
}

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config resolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  // If the developer didn't initialize the SDK, let them know.
  if (!_isInitialized) {
    reject(@"ERR_FACEBOOK_UNINITIALIZED", @"Facebook SDK has not been initialized yet.", nil);
    return;
  }
  [super logInWithReadPermissionsWithConfig:config resolver:resolve rejecter:reject];
}

- (void)getAuthenticationCredentialAsync:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  // If the developer didn't initialize the SDK, let them know.
  if (!_isInitialized) {
    reject(@"ERR_FACEBOOK_UNINITIALIZED", @"Facebook SDK has not been initialized yet.", nil);
    return;
  }
  [super getAuthenticationCredentialAsync:resolve rejecter:reject];
}

- (void)logOutAsync:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  // If the developer didn't initialize the SDK, let them know.
  if (!_isInitialized) {
    reject(@"ERR_FACEBOOK_UNINITIALIZED", @"Facebook SDK has not been initialized yet.", nil);
    return;
  }
  [super logOutAsync:resolve rejecter:reject];
}

# pragma mark - ABI47_0_0EXModuleRegistryConsumer

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  [super setModuleRegistry:moduleRegistry];

  id<ABI47_0_0EXAppLifecycleService> appLifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXAppLifecycleService)];
  [appLifecycleService registerAppLifecycleListener:self];
}

# pragma mark - ABI47_0_0EXAppLifecycleListener

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
