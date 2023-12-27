/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTDevSettings.h"

#import <objc/runtime.h>

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge+Private.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcherProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTProfile.h>
#import <ABI43_0_0React/ABI43_0_0RCTReloadCommand.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import <ABI43_0_0React/ABI43_0_0RCTDevMenu.h>

#import "ABI43_0_0CoreModulesPlugins.h"

static NSString *const kABI43_0_0RCTDevSettingProfilingEnabled = @"profilingEnabled";
static NSString *const kABI43_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
static NSString *const kABI43_0_0RCTDevSettingIsInspectorShown = @"showInspector";
static NSString *const kABI43_0_0RCTDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";
static NSString *const kABI43_0_0RCTDevSettingExecutorOverrideClass = @"executor-override";
static NSString *const kABI43_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
static NSString *const kABI43_0_0RCTDevSettingIsPerfMonitorShown = @"ABI43_0_0RCTPerfMonitorKey";

static NSString *const kABI43_0_0RCTDevSettingsUserDefaultsKey = @"ABI43_0_0RCTDevMenu";

#if ABI43_0_0ENABLE_PACKAGER_CONNECTION
#import <ABI43_0_0React/ABI43_0_0RCTPackagerClient.h>
#import <ABI43_0_0React/ABI43_0_0RCTPackagerConnection.h>
#endif

#if ABI43_0_0RCT_ENABLE_INSPECTOR
#import <ABI43_0_0React/ABI43_0_0RCTInspectorDevServerHelper.h>
#endif

#if ABI43_0_0RCT_DEV
static BOOL devSettingsMenuEnabled = YES;
#else
static BOOL devSettingsMenuEnabled = NO;
#endif

void ABI43_0_0RCTDevSettingsSetEnabled(BOOL enabled)
{
  devSettingsMenuEnabled = enabled;
}

#if ABI43_0_0RCT_DEV_MENU

@interface ABI43_0_0RCTDevSettingsUserDefaultsDataSource : NSObject <ABI43_0_0RCTDevSettingsDataSource>

@end

@implementation ABI43_0_0RCTDevSettingsUserDefaultsDataSource {
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
  ABI43_0_0RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:kABI43_0_0RCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSDictionary *existingSettings = [_userDefaults objectForKey:kABI43_0_0RCTDevSettingsUserDefaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:kABI43_0_0RCTDevSettingsUserDefaultsKey];
}

@end

@interface ABI43_0_0RCTDevSettings () <ABI43_0_0RCTBridgeModule, ABI43_0_0RCTInvalidating, ABI43_0_0NativeDevSettingsSpec> {
  BOOL _isJSLoaded;
#if ABI43_0_0ENABLE_PACKAGER_CONNECTION
  ABI43_0_0RCTHandlerToken _reloadToken;
#endif
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<ABI43_0_0RCTDevSettingsDataSource> dataSource;

@end

@implementation ABI43_0_0RCTDevSettings

ABI43_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  // Default behavior is to use NSUserDefaults with shake and hot loading enabled.
  NSDictionary *defaultValues = @{
    kABI43_0_0RCTDevSettingShakeToShowDevMenu : @YES,
    kABI43_0_0RCTDevSettingHotLoadingEnabled : @YES,
  };
  ABI43_0_0RCTDevSettingsUserDefaultsDataSource *dataSource =
      [[ABI43_0_0RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
  return [self initWithDataSource:dataSource];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)initWithDataSource:(id<ABI43_0_0RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:ABI43_0_0RCTJavaScriptDidLoadNotification
                                               object:nil];
  }
  return self;
}

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

#if ABI43_0_0ENABLE_PACKAGER_CONNECTION
  ABI43_0_0RCTBridge *__weak weakBridge = bridge;
  _reloadToken = [[ABI43_0_0RCTPackagerConnection sharedPackagerConnection]
      addNotificationHandler:^(id params) {
        if (params != (id)kCFNull && [params[@"debug"] boolValue]) {
          weakBridge.executorClass = objc_lookUpClass("ABI43_0_0RCTWebSocketExecutor");
        }
        ABI43_0_0RCTTriggerReloadCommandListeners(@"Global hotkey");
      }
                       queue:dispatch_get_main_queue()
                   forMethod:@"reload"];
#endif

#if ABI43_0_0RCT_ENABLE_INSPECTOR
  // We need this dispatch to the main thread because the bridge is not yet
  // finished with its initialisation. By the time it relinquishes control of
  // the main thread, this operation can be performed.
  dispatch_async(dispatch_get_main_queue(), ^{
    [bridge
        dispatchBlock:^{
          [ABI43_0_0RCTInspectorDevServerHelper connectWithBundleURL:bridge.bundleURL];
        }
                queue:ABI43_0_0RCTJSThread];
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
  [super invalidate];
#if ABI43_0_0ENABLE_PACKAGER_CONNECTION
  [[ABI43_0_0RCTPackagerConnection sharedPackagerConnection] removeHandler:_reloadToken];
#endif
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"didPressMenuItem" ];
}

- (void)_updateSettingWithValue:(id)value forKey:(NSString *)key
{
  [_dataSource updateSettingWithValue:value forKey:key];
}

- (id)settingForKey:(NSString *)key
{
  return [_dataSource settingForKey:key];
}

- (BOOL)isDeviceDebuggingAvailable
{
#if ABI43_0_0RCT_ENABLE_INSPECTOR
  return self.bridge.isInspectable;
#else
  return false;
#endif // ABI43_0_0RCT_ENABLE_INSPECTOR
}

- (BOOL)isRemoteDebuggingAvailable
{
  if (ABI43_0_0RCTTurboModuleEnabled()) {
    return NO;
  }
  Class jsDebuggingExecutorClass = objc_lookUpClass("ABI43_0_0RCTWebSocketExecutor");
  return (jsDebuggingExecutorClass != nil);
}

- (BOOL)isHotLoadingAvailable
{
  return self.bridge.bundleURL && !self.bridge.bundleURL.fileURL; // Only works when running from server
}

ABI43_0_0RCT_EXPORT_METHOD(reload)
{
  ABI43_0_0RCTTriggerReloadCommandListeners(@"Unknown From JS");
}

ABI43_0_0RCT_EXPORT_METHOD(reloadWithReason : (NSString *)reason)
{
  ABI43_0_0RCTTriggerReloadCommandListeners(reason);
}

ABI43_0_0RCT_EXPORT_METHOD(onFastRefresh)
{
  [self.bridge onFastRefresh];
}

ABI43_0_0RCT_EXPORT_METHOD(setIsShakeToShowDevMenuEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI43_0_0RCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return [[self settingForKey:kABI43_0_0RCTDevSettingShakeToShowDevMenu] boolValue];
}

ABI43_0_0RCT_EXPORT_METHOD(setIsDebuggingRemotely : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI43_0_0RCTDevSettingIsDebuggingRemotely];
  [self _remoteDebugSettingDidChange];
}

- (BOOL)isDebuggingRemotely
{
  return [[self settingForKey:kABI43_0_0RCTDevSettingIsDebuggingRemotely] boolValue];
}

- (void)_remoteDebugSettingDidChange
{
  // This value is passed as a command-line argument, so fall back to reading from NSUserDefaults directly
  NSString *executorOverride = [[NSUserDefaults standardUserDefaults] stringForKey:kABI43_0_0RCTDevSettingExecutorOverrideClass];
  Class executorOverrideClass = executorOverride ? NSClassFromString(executorOverride) : nil;
  if (executorOverrideClass) {
    self.executorClass = executorOverrideClass;
  } else {
    BOOL enabled = self.isRemoteDebuggingAvailable && self.isDebuggingRemotely;
    self.executorClass = enabled ? objc_getClass("ABI43_0_0RCTWebSocketExecutor") : nil;
  }
}

ABI43_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI43_0_0RCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kABI43_0_0RCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (self.isHotLoadingAvailable && enabled != ABI43_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [self.bridge startProfiling];
    } else {
      [self.bridge stopProfiling:^(NSData *logData) {
        ABI43_0_0RCTProfileSendResult(self.bridge, @"systrace", logData);
      }];
    }
  }
}

ABI43_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  if (self.isHotLoadingEnabled != enabled) {
    [self _updateSettingWithValue:@(enabled) forKey:kABI43_0_0RCTDevSettingHotLoadingEnabled];
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
  return [[self settingForKey:kABI43_0_0RCTDevSettingHotLoadingEnabled] boolValue];
}

ABI43_0_0RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kABI43_0_0RCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kABI43_0_0RCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

ABI43_0_0RCT_EXPORT_METHOD(addMenuItem : (NSString *)title)
{
  __weak __typeof(self) weakSelf = self;
  [self.bridge.devMenu addItem:[ABI43_0_0RCTDevMenuItem buttonItemWithTitle:title
                                                           handler:^{
                                                             [weakSelf sendEventWithName:@"didPressMenuItem"
                                                                                    body:@{@"title" : title}];
                                                           }]];
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kABI43_0_0RCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kABI43_0_0RCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kABI43_0_0RCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (self.bridge.executorClass != executorClass) {
    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil && self.bridge.executorClass != objc_lookUpClass("ABI43_0_0RCTWebSocketExecutor")) {
      return;
    }

    self.bridge.executorClass = executorClass;
    ABI43_0_0RCTTriggerReloadCommandListeners(@"Custom executor class reset");
  }
}

- (void)addHandler:(id<ABI43_0_0RCTPackagerClientMethod>)handler forPackagerMethod:(NSString *)name
{
#if ABI43_0_0ENABLE_PACKAGER_CONNECTION
  [[ABI43_0_0RCTPackagerConnection sharedPackagerConnection] addHandler:handler forMethod:name];
#endif
}

- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) {
    NSString *const path = [bundleURL.path substringFromIndex:1]; // Strip initial slash.
    NSString *const host = bundleURL.host;
    NSNumber *const port = bundleURL.port;
    BOOL isHotLoadingEnabled = self.isHotLoadingEnabled;
    if (self.bridge) {
      [self.bridge enqueueJSCall:@"HMRClient"
                          method:@"setup"
                            args:@[ @"ios", path, host, ABI43_0_0RCTNullIfNil(port), @(isHotLoadingEnabled) ]
                      completion:NULL];
    } else {
      self.invokeJS(@"HMRClient", @"setup", @[ @"ios", path, host, ABI43_0_0RCTNullIfNil(port), @(isHotLoadingEnabled) ]);
    }
  }
}

- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) { // isHotLoadingAvailable check
    if (self.bridge) {
      [self.bridge enqueueJSCall:@"HMRClient"
                          method:@"registerBundle"
                            args:@[ [bundleURL absoluteString] ]
                      completion:NULL];
    } else {
      self.invokeJS(@"HMRClient", @"registerBundle", @[ [bundleURL absoluteString] ]);
    }
  }
}

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

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeDevSettingsSpecJSI>(params);
}

@end

#else // #if ABI43_0_0RCT_DEV_MENU

@interface ABI43_0_0RCTDevSettings () <ABI43_0_0NativeDevSettingsSpec>
@end

@implementation ABI43_0_0RCTDevSettings

- (instancetype)initWithDataSource:(id<ABI43_0_0RCTDevSettingsDataSource>)dataSource
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
+ (BOOL)requiresMainQueueSetup
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
- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL
{
}
- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL
{
}
- (void)addMenuItem:(NSString *)title
{
}
- (void)setIsShakeToShowDevMenuEnabled:(BOOL)enabled
{
}

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeDevSettingsSpecJSI>(params);
}

@end

#endif // #if ABI43_0_0RCT_DEV_MENU

@implementation ABI43_0_0RCTBridge (ABI43_0_0RCTDevSettings)

- (ABI43_0_0RCTDevSettings *)devSettings
{
#if ABI43_0_0RCT_DEV_MENU
  return devSettingsMenuEnabled ? [self moduleForClass:[ABI43_0_0RCTDevSettings class]] : nil;
#else
  return nil;
#endif
}

@end

Class ABI43_0_0RCTDevSettingsCls(void)
{
  return ABI43_0_0RCTDevSettings.class;
}
