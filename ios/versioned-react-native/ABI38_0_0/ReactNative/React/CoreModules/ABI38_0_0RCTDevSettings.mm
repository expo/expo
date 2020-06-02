/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTDevSettings.h"

#import <objc/runtime.h>

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge+Private.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTLog.h>
#import <ABI38_0_0React/ABI38_0_0RCTProfile.h>
#import <ABI38_0_0React/ABI38_0_0RCTReloadCommand.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

#import <ABI38_0_0React/ABI38_0_0RCTDevMenu.h>

#import "ABI38_0_0CoreModulesPlugins.h"

static NSString *const kABI38_0_0RCTDevSettingProfilingEnabled = @"profilingEnabled";
static NSString *const kABI38_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
static NSString *const kABI38_0_0RCTDevSettingIsInspectorShown = @"showInspector";
static NSString *const kABI38_0_0RCTDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";
static NSString *const kABI38_0_0RCTDevSettingExecutorOverrideClass = @"executor-override";
static NSString *const kABI38_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
static NSString *const kABI38_0_0RCTDevSettingIsPerfMonitorShown = @"ABI38_0_0RCTPerfMonitorKey";

static NSString *const kABI38_0_0RCTDevSettingsUserDefaultsKey = @"ABI38_0_0RCTDevMenu";

#if ABI38_0_0ENABLE_PACKAGER_CONNECTION
#import <ABI38_0_0React/ABI38_0_0RCTPackagerClient.h>
#import <ABI38_0_0React/ABI38_0_0RCTPackagerConnection.h>
#endif

#if ABI38_0_0RCT_ENABLE_INSPECTOR
#import <ABI38_0_0React/ABI38_0_0RCTInspectorDevServerHelper.h>
#endif

#if ABI38_0_0RCT_DEV
static BOOL devSettingsMenuEnabled = YES;
#else
static BOOL devSettingsMenuEnabled = NO;
#endif

void ABI38_0_0RCTDevSettingsSetEnabled(BOOL enabled) {
  devSettingsMenuEnabled = enabled;
}

#if ABI38_0_0RCT_DEV_MENU

@interface ABI38_0_0RCTDevSettingsUserDefaultsDataSource : NSObject <ABI38_0_0RCTDevSettingsDataSource>

@end

@implementation ABI38_0_0RCTDevSettingsUserDefaultsDataSource {
  NSMutableDictionary *_settings;
  NSUserDefaults *_userDefaults;
}

- (instancetype)init
{
  return [self initWithDefaultValues:nil];
}

- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
{
  if (self = [super init]) {
    _userDefaults = [NSUserDefaults standardUserDefaults];
    if (defaultValues) {
      [self _reloadWithDefaults:defaultValues];
    }
  }
  return self;
}

- (void)updateSettingWithValue:(id)value forKey:(NSString *)key
{
  ABI38_0_0RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:kABI38_0_0RCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSDictionary *existingSettings = [_userDefaults objectForKey:kABI38_0_0RCTDevSettingsUserDefaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:kABI38_0_0RCTDevSettingsUserDefaultsKey];
}

@end

@interface ABI38_0_0RCTDevSettings () <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTInvalidating> {
  BOOL _isJSLoaded;
#if ABI38_0_0ENABLE_PACKAGER_CONNECTION
  ABI38_0_0RCTHandlerToken _reloadToken;
#endif
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<ABI38_0_0RCTDevSettingsDataSource> dataSource;

@end

@implementation ABI38_0_0RCTDevSettings

ABI38_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES; // ABI38_0_0RCT_DEV-only
}

- (instancetype)init
{
  // default behavior is to use NSUserDefaults
  NSDictionary *defaultValues = @{
    kABI38_0_0RCTDevSettingShakeToShowDevMenu : @YES,
    kABI38_0_0RCTDevSettingHotLoadingEnabled : @YES,
  };
  ABI38_0_0RCTDevSettingsUserDefaultsDataSource *dataSource =
      [[ABI38_0_0RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
  return [self initWithDataSource:dataSource];
}

- (instancetype)initWithDataSource:(id<ABI38_0_0RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:ABI38_0_0RCTJavaScriptDidLoadNotification
                                               object:nil];
  }
  return self;
}

- (void)setBridge:(ABI38_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

#if ABI38_0_0ENABLE_PACKAGER_CONNECTION
  ABI38_0_0RCTBridge *__weak weakBridge = bridge;
  _reloadToken = [[ABI38_0_0RCTPackagerConnection sharedPackagerConnection]
      addNotificationHandler:^(id params) {
        if (params != (id)kCFNull && [params[@"debug"] boolValue]) {
          weakBridge.executorClass = objc_lookUpClass("ABI38_0_0RCTWebSocketExecutor");
        }
        ABI38_0_0RCTTriggerReloadCommandListeners(@"Global hotkey");
      }
                       queue:dispatch_get_main_queue()
                   forMethod:@"reload"];
#endif

#if ABI38_0_0RCT_ENABLE_INSPECTOR
  // we need this dispatch back to the main thread because even though this
  // is executed on the main thread, at this point the bridge is not yet
  // finished with its initialisation. But it does finish by the time it
  // relinquishes control of the main thread, so only queue on the JS thread
  // after the current main thread operation is done.
  dispatch_async(dispatch_get_main_queue(), ^{
    [bridge
        dispatchBlock:^{
          [ABI38_0_0RCTInspectorDevServerHelper connectWithBundleURL:bridge.bundleURL];
        }
                queue:ABI38_0_0RCTJSThread];
  });
#endif

  dispatch_async(dispatch_get_main_queue(), ^{
    [self _synchronizeAllSettings];
  });
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
#if ABI38_0_0ENABLE_PACKAGER_CONNECTION
  [[ABI38_0_0RCTPackagerConnection sharedPackagerConnection] removeHandler:_reloadToken];
#endif
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"didPressMenuItem"];
}

- (void)_updateSettingWithValue:(id)value forKey:(NSString *)key
{
  [_dataSource updateSettingWithValue:value forKey:key];
}

- (id)settingForKey:(NSString *)key
{
  return [_dataSource settingForKey:key];
}

- (BOOL)isNuclideDebuggingAvailable
{
#if ABI38_0_0RCT_ENABLE_INSPECTOR
  return self.bridge.isInspectable;
#else
  return false;
#endif // ABI38_0_0RCT_ENABLE_INSPECTOR
}

- (BOOL)isRemoteDebuggingAvailable
{
  if (ABI38_0_0RCTTurboModuleEnabled()) {
    return NO;
  }
  Class jsDebuggingExecutorClass = objc_lookUpClass("ABI38_0_0RCTWebSocketExecutor");
  return (jsDebuggingExecutorClass != nil);
}

- (BOOL)isHotLoadingAvailable
{
  return self.bridge.bundleURL && !self.bridge.bundleURL.fileURL; // Only works when running from server
}

ABI38_0_0RCT_EXPORT_METHOD(reload)
{
  ABI38_0_0RCTTriggerReloadCommandListeners(@"Unknown From JS");
}

ABI38_0_0RCT_EXPORT_METHOD(reloadWithReason : (NSString *) reason)
{
  ABI38_0_0RCTTriggerReloadCommandListeners(reason);
}

ABI38_0_0RCT_EXPORT_METHOD(onFastRefresh)
{
    [self.bridge onFastRefresh];
}

ABI38_0_0RCT_EXPORT_METHOD(setIsShakeToShowDevMenuEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI38_0_0RCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingShakeToShowDevMenu] boolValue];
}

ABI38_0_0RCT_EXPORT_METHOD(setIsDebuggingRemotely : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI38_0_0RCTDevSettingIsDebuggingRemotely];
  [self _remoteDebugSettingDidChange];
}

- (BOOL)isDebuggingRemotely
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingIsDebuggingRemotely] boolValue];
}

- (void)_remoteDebugSettingDidChange
{
  // This value is passed as a command-line argument, so fall back to reading from NSUserDefaults directly
  NSString *executorOverride = [[NSUserDefaults standardUserDefaults] stringForKey:kABI38_0_0RCTDevSettingExecutorOverrideClass];
  Class executorOverrideClass = executorOverride ? NSClassFromString(executorOverride) : nil;
  if (executorOverrideClass) {
    self.executorClass = executorOverrideClass;
  } else {
    BOOL enabled = self.isRemoteDebuggingAvailable && self.isDebuggingRemotely;
    self.executorClass = enabled ? objc_getClass("ABI38_0_0RCTWebSocketExecutor") : nil;
  }
}

ABI38_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI38_0_0RCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (self.isHotLoadingAvailable && enabled != ABI38_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [self.bridge startProfiling];
    } else {
      [self.bridge stopProfiling:^(NSData *logData) {
        ABI38_0_0RCTProfileSendResult(self.bridge, @"systrace", logData);
      }];
    }
  }
}

ABI38_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  if (self.isHotLoadingEnabled != enabled) {
    [self _updateSettingWithValue:@(enabled) forKey:kABI38_0_0RCTDevSettingHotLoadingEnabled];
    if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      if (enabled) {
        [self.bridge enqueueJSCall:@"HMRClient" method:@"enable" args:@[] completion:NULL];
      } else {
        [self.bridge enqueueJSCall:@"HMRClient" method:@"disable" args:@[] completion:NULL];
      }
#pragma clang diagnostic pop
    }
  }
}

- (BOOL)isHotLoadingEnabled
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingHotLoadingEnabled] boolValue];
}

ABI38_0_0RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kABI38_0_0RCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kABI38_0_0RCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

ABI38_0_0RCT_EXPORT_METHOD(addMenuItem:(NSString *)title)
{
  __weak __typeof(self) weakSelf = self;
  [self.bridge.devMenu addItem:[ABI38_0_0RCTDevMenuItem buttonItemWithTitle:title handler:^{
    [weakSelf sendEventWithName:@"didPressMenuItem" body:@{@"title": title}];
  }]];
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kABI38_0_0RCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kABI38_0_0RCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (self.bridge.executorClass != executorClass) {
    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil && self.bridge.executorClass != objc_lookUpClass("ABI38_0_0RCTWebSocketExecutor")) {
      return;
    }

    self.bridge.executorClass = executorClass;
    ABI38_0_0RCTTriggerReloadCommandListeners(@"Custom executor class reset");
  }
}

#if ABI38_0_0RCT_DEV_MENU

- (void)addHandler:(id<ABI38_0_0RCTPackagerClientMethod>)handler forPackagerMethod:(NSString *)name
{
#if ABI38_0_0ENABLE_PACKAGER_CONNECTION
  [[ABI38_0_0RCTPackagerConnection sharedPackagerConnection] addHandler:handler forMethod:name];
#endif
}

#endif

#pragma mark - Internal

/**
 *  Query the data source for all possible settings and make sure we're doing the right
 *  thing for the state of each setting.
 */
- (void)_synchronizeAllSettings
{
  [self _remoteDebugSettingDidChange];
  [self _profilingSettingDidChange];
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != self.bridge) {
    return;
  }

  _isJSLoaded = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    // update state again after the bridge has finished loading
    [self _synchronizeAllSettings];

    // Inspector can only be shown after JS has loaded
    if ([self isElementInspectorShown]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
    }
  });
}

@end

#else // #if ABI38_0_0RCT_DEV

@implementation ABI38_0_0RCTDevSettings

- (instancetype)initWithDataSource:(id<ABI38_0_0RCTDevSettingsDataSource>)dataSource
{
  return [super init];
}
- (BOOL)isHotLoadingAvailable
{
  return NO;
}
- (BOOL)isRemoteDebuggingAvailable
{
  return NO;
}
- (id)settingForKey:(NSString *)key
{
  return nil;
}
- (void)reload
{
}
- (void)reloadWithReason:(NSString *)reason
{
}
- (void)onFastRefresh
{
}
- (void)setHotLoadingEnabled:(BOOL)isHotLoadingEnabled
{
}
- (void)setIsDebuggingRemotely:(BOOL)isDebuggingRemotelyEnabled
{
}
- (void)setProfilingEnabled:(BOOL)isProfilingEnabled
{
}
- (void)toggleElementInspector
{
}
- (void)addMenuItem:(NSString *)title
{
}
- (void)setIsShakeToShowDevMenuEnabled:(BOOL)enabled
{
}

@end

#endif

@implementation ABI38_0_0RCTBridge (ABI38_0_0RCTDevSettings)

- (ABI38_0_0RCTDevSettings *)devSettings
{
#if ABI38_0_0RCT_DEV_MENU
  return devSettingsMenuEnabled ? [self moduleForClass:[ABI38_0_0RCTDevSettings class]] : nil;
#else
  return nil;
#endif
}

@end

Class ABI38_0_0RCTDevSettingsCls(void) {
  return ABI38_0_0RCTDevSettings.class;
}
