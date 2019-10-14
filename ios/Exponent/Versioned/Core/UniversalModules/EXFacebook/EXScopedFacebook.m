// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import "EXScopedFacebook.h"
#import <FBSDKCoreKit/FBSDKSettings.h>
#import <UMCore/UMAppLifecycleService.h>

@interface EXFacebook (ExportedMethods)

- (void)initializeWithAppId:(NSString *)appId
                    appName:(NSString *)appName
                   resolver:(UMPromiseResolveBlock)resolve
                   rejecter:(UMPromiseRejectBlock)reject;

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config
                                  resolver:(UMPromiseResolveBlock)resolve
                                  rejecter:(UMPromiseRejectBlock)reject;

- (void)setAutoInitEnabled:(BOOL)enabled
                  resolver:(UMPromiseResolveBlock)resolve
                  rejecter:(UMPromiseRejectBlock)reject;

@end

static NSString *AUTO_INIT_KEY = @"autoInitEnabled";

@interface EXScopedFacebook ()

@property (nonatomic, assign) BOOL isInitialized;
@property (nonatomic, strong) NSString *appId;
@property (nonatomic, strong) NSString *displayName;
@property (nonatomic, strong) NSUserDefaults *settings;

@end

// Expo client-only EXFacebook module, which ensures that Facebook SDK configurations
// of different experiences don't collide.

@implementation EXScopedFacebook : EXFacebook

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    NSString *suiteName = [NSString stringWithFormat:@"%@#%@", NSStringFromClass(self.class), experienceId];
    _settings = [[NSUserDefaults alloc] initWithSuiteName:suiteName];
    _isInitialized = [_settings boolForKey:@"autoInit"];
  }
  return self;
}

- (void)initializeWithAppId:(NSString *)appId
                    appName:(NSString *)appName
                   resolver:(UMPromiseResolveBlock)resolve
                   rejecter:(UMPromiseRejectBlock)reject
{
  _isInitialized = YES;
  [super initializeWithAppId:appId appName:appName resolver:resolve rejecter:reject];
}

- (void)setAutoInitEnabled:(BOOL)enabled resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  if (enabled) {
    [_settings setBool:enabled forKey:@"autoInit"];
    // Facebook SDK on iOS is initialized when `setAutoInitEnabled` is called with `YES`.
    _isInitialized = YES;
  }
  [super setAutoInitEnabled:enabled resolver:resolve rejecter:reject];
}

- (void)logInWithReadPermissionsWithConfig:(NSDictionary *)config resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  // If the developer didn't initialize the SDK, let them know.
  if (!_isInitialized) {
    reject(@"E_NO_INIT", @"Facebook SDK has not been initialized yet.", nil);
    return;
  }
  [super logInWithReadPermissionsWithConfig:config resolver:resolve rejecter:reject];
}

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  id<UMAppLifecycleService> appLifecycleService = [moduleRegistry getModuleImplementingProtocol:@protocol(UMAppLifecycleService)];
  [appLifecycleService registerAppLifecycleListener:self];
}

# pragma mark - UMAppLifecycleListener

- (void)onAppBackgrounded {
  _appId = [FBSDKSettings appID];
  _displayName = [FBSDKSettings displayName];
  [FBSDKSettings setAppID:nil];
  [FBSDKSettings setDisplayName:nil];
}

- (void)onAppForegrounded {
  if (_appId) {
    [FBSDKSettings setAppID:_appId];
  }
  if (_displayName) {
    [FBSDKSettings setDisplayName:_displayName];
  }
}

@end
#endif
