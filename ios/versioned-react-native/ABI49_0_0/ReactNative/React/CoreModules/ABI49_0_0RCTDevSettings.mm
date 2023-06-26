/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTDevSettings.h"

#import <objc/runtime.h>

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTConstants.h>
#import <ABI49_0_0React/ABI49_0_0RCTDevMenu.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTProfile.h>
#import <ABI49_0_0React/ABI49_0_0RCTReloadCommand.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <atomic>

#import "ABI49_0_0CoreModulesPlugins.h"

static NSString *const kABI49_0_0RCTDevSettingProfilingEnabled = @"profilingEnabled";
static NSString *const kABI49_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
static NSString *const kABI49_0_0RCTDevSettingIsInspectorShown = @"showInspector";
static NSString *const kABI49_0_0RCTDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";
static NSString *const kABI49_0_0RCTDevSettingExecutorOverrideClass = @"executor-override";
static NSString *const kABI49_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
static NSString *const kABI49_0_0RCTDevSettingIsPerfMonitorShown = @"ABI49_0_0RCTPerfMonitorKey";

static NSString *const kABI49_0_0RCTDevSettingsUserDefaultsKey = @"ABI49_0_0RCTDevMenu";

#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
#import <ABI49_0_0React/ABI49_0_0RCTPackagerClient.h>
#import <ABI49_0_0React/ABI49_0_0RCTPackagerConnection.h>
#endif

#if ABI49_0_0RCT_ENABLE_INSPECTOR
#import <ABI49_0_0React/ABI49_0_0RCTInspectorDevServerHelper.h>
#endif

#if ABI49_0_0RCT_DEV
static BOOL devSettingsMenuEnabled = YES;
#else
static BOOL devSettingsMenuEnabled = NO;
#endif

void ABI49_0_0RCTDevSettingsSetEnabled(BOOL enabled)
{
  devSettingsMenuEnabled = enabled;
}

#if ABI49_0_0RCT_DEV_MENU || ABI49_0_0RCT_REMOTE_PROFILE

@interface ABI49_0_0RCTDevSettingsUserDefaultsDataSource : NSObject <ABI49_0_0RCTDevSettingsDataSource>

@end

@implementation ABI49_0_0RCTDevSettingsUserDefaultsDataSource {
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
  ABI49_0_0RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:kABI49_0_0RCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSDictionary *existingSettings = [_userDefaults objectForKey:kABI49_0_0RCTDevSettingsUserDefaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:kABI49_0_0RCTDevSettingsUserDefaultsKey];
}

@end

#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
static ABI49_0_0RCTHandlerToken reloadToken;
static ABI49_0_0RCTHandlerToken devMenuToken;
static std::atomic<int> numInitializedModules{0};
#endif

@interface ABI49_0_0RCTDevSettings () <ABI49_0_0RCTBridgeModule, ABI49_0_0RCTInvalidating, ABI49_0_0NativeDevSettingsSpec, ABI49_0_0RCTDevSettingsInspectable> {
  BOOL _isJSLoaded;
#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  ABI49_0_0RCTHandlerToken _bridgeExecutorOverrideToken;
#endif
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<ABI49_0_0RCTDevSettingsDataSource> dataSource;

@end

@implementation ABI49_0_0RCTDevSettings

@synthesize isInspectable = _isInspectable;
@synthesize bundleManager = _bundleManager;

ABI49_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  // Default behavior is to use NSUserDefaults with shake and hot loading enabled.
  NSDictionary *defaultValues = @{
    kABI49_0_0RCTDevSettingShakeToShowDevMenu : @YES,
    kABI49_0_0RCTDevSettingHotLoadingEnabled : @YES,
  };
  ABI49_0_0RCTDevSettingsUserDefaultsDataSource *dataSource =
      [[ABI49_0_0RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
  return [self initWithDataSource:dataSource];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)initWithDataSource:(id<ABI49_0_0RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:ABI49_0_0RCTJavaScriptDidLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:@"ABI49_0_0RCTInstanceDidLoadBundle"
                                               object:nil];
  }
  return self;
}

- (void)initialize
{
#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  if (self.bridge) {
    ABI49_0_0RCTBridge *__weak weakBridge = self.bridge;
    _bridgeExecutorOverrideToken = [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection]
        addNotificationHandler:^(id params) {
          if (params != (id)kCFNull && [params[@"debug"] boolValue]) {
            weakBridge.executorClass = objc_lookUpClass("ABI49_0_0RCTWebSocketExecutor");
          }
        }
                         queue:dispatch_get_main_queue()
                     forMethod:@"reload"];
  }

  if (numInitializedModules++ == 0) {
    reloadToken = [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection]
        addNotificationHandler:^(id params) {
          ABI49_0_0RCTTriggerReloadCommandListeners(@"Global hotkey");
        }
                         queue:dispatch_get_main_queue()
                     forMethod:@"reload"];
#if ABI49_0_0RCT_DEV_MENU
    devMenuToken = [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection]
        addNotificationHandler:^(id params) {
          [self.bridge.devMenu show];
        }
                         queue:dispatch_get_main_queue()
                     forMethod:@"devMenu"];
#endif
  }
#endif

#if ABI49_0_0RCT_ENABLE_INSPECTOR
  if (self.bridge) {
    // We need this dispatch to the main thread because the bridge is not yet
    // finished with its initialisation. By the time it relinquishes control of
    // the main thread, this operation can be performed.
    __weak __typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      id dispatchBlock = ^{
        __typeof(self) strongSelf2 = weakSelf;
        if (!strongSelf2) {
          return;
        }
        NSURL *url = strongSelf2.bundleManager.bundleURL;
        [ABI49_0_0RCTInspectorDevServerHelper connectWithBundleURL:url];
      };
      [strongSelf.bridge dispatchBlock:dispatchBlock queue:ABI49_0_0RCTJSThread];
    });
  } else {
    NSURL *url = self.bundleManager.bundleURL;
    [ABI49_0_0RCTInspectorDevServerHelper connectWithBundleURL:url];
  }
#endif

  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf _synchronizeAllSettings];
  });
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [super invalidate];
#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  if (self.bridge) {
    [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection] removeHandler:_bridgeExecutorOverrideToken];
  }

  if (--numInitializedModules == 0) {
    [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection] removeHandler:reloadToken];
#if ABI49_0_0RCT_DEV_MENU
    [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection] removeHandler:devMenuToken];
#endif
  }
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
#if ABI49_0_0RCT_ENABLE_INSPECTOR
  if (self.bridge) {
    return self.bridge.isInspectable;
  } else {
    return self.isInspectable;
  }
#else
  return false;
#endif // ABI49_0_0RCT_ENABLE_INSPECTOR
}

- (BOOL)isRemoteDebuggingAvailable
{
  if (ABI49_0_0RCTTurboModuleEnabled()) {
    return NO;
  }
  Class jsDebuggingExecutorClass = objc_lookUpClass("ABI49_0_0RCTWebSocketExecutor");
  return (jsDebuggingExecutorClass != nil);
}

- (BOOL)isHotLoadingAvailable
{
  if (self.bundleManager.bundleURL) {
    return !self.bundleManager.bundleURL.fileURL;
  }
  return NO;
}

ABI49_0_0RCT_EXPORT_METHOD(reload)
{
  ABI49_0_0RCTTriggerReloadCommandListeners(@"Unknown From JS");
}

ABI49_0_0RCT_EXPORT_METHOD(reloadWithReason : (NSString *)reason)
{
  ABI49_0_0RCTTriggerReloadCommandListeners(reason);
}

ABI49_0_0RCT_EXPORT_METHOD(onFastRefresh)
{
  [self.bridge onFastRefresh];
}

ABI49_0_0RCT_EXPORT_METHOD(setIsShakeToShowDevMenuEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI49_0_0RCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingShakeToShowDevMenu] boolValue];
}

ABI49_0_0RCT_EXPORT_METHOD(setIsDebuggingRemotely : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI49_0_0RCTDevSettingIsDebuggingRemotely];
  [self _remoteDebugSettingDidChange];
}

- (BOOL)isDebuggingRemotely
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingIsDebuggingRemotely] boolValue];
}

- (void)_remoteDebugSettingDidChange
{
  // This value is passed as a command-line argument, so fall back to reading from NSUserDefaults directly
  NSString *executorOverride = [[NSUserDefaults standardUserDefaults] stringForKey:kABI49_0_0RCTDevSettingExecutorOverrideClass];
  Class executorOverrideClass = executorOverride ? NSClassFromString(executorOverride) : nil;
  if (executorOverrideClass) {
    self.executorClass = executorOverrideClass;
  } else {
    BOOL enabled = self.isRemoteDebuggingAvailable && self.isDebuggingRemotely;
    self.executorClass = enabled ? objc_getClass("ABI49_0_0RCTWebSocketExecutor") : nil;
  }
}

ABI49_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI49_0_0RCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (self.isHotLoadingAvailable && enabled != ABI49_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [self.bridge startProfiling];
    } else {
      __weak __typeof(self) weakSelf = self;
      [self.bridge stopProfiling:^(NSData *logData) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }
        ABI49_0_0RCTProfileSendResult(strongSelf.bridge, @"systrace", logData);
      }];
    }
  }
}

ABI49_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  if (self.isHotLoadingEnabled != enabled) {
    [self _updateSettingWithValue:@(enabled) forKey:kABI49_0_0RCTDevSettingHotLoadingEnabled];
    if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      if (enabled) {
        if (self.callableJSModules) {
          [self.callableJSModules invokeModule:@"HMRClient" method:@"enable" withArgs:@[]];
        }
      } else {
        if (self.callableJSModules) {
          [self.callableJSModules invokeModule:@"HMRClient" method:@"disable" withArgs:@[]];
        }
      }
#pragma clang diagnostic pop
    }
  }
}

- (BOOL)isHotLoadingEnabled
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingHotLoadingEnabled] boolValue];
}

ABI49_0_0RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kABI49_0_0RCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kABI49_0_0RCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[self.moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

ABI49_0_0RCT_EXPORT_METHOD(addMenuItem : (NSString *)title)
{
  __weak __typeof(self) weakSelf = self;
  [(ABI49_0_0RCTDevMenu *)[self.moduleRegistry moduleForName:"DevMenu"]
      addItem:[ABI49_0_0RCTDevMenuItem buttonItemWithTitle:title
                                          handler:^{
                                            [weakSelf sendEventWithName:@"didPressMenuItem" body:@{@"title" : title}];
                                          }]];
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kABI49_0_0RCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kABI49_0_0RCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (self.bridge.executorClass != executorClass) {
    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil && self.bridge.executorClass != objc_lookUpClass("ABI49_0_0RCTWebSocketExecutor")) {
      return;
    }

    self.bridge.executorClass = executorClass;
    ABI49_0_0RCTTriggerReloadCommandListeners(@"Custom executor class reset");
  }
}

- (void)addHandler:(id<ABI49_0_0RCTPackagerClientMethod>)handler forPackagerMethod:(NSString *)name
{
#if ABI49_0_0RCT_DEV_SETTINGS_ENABLE_PACKAGER_CONNECTION
  [[ABI49_0_0RCTPackagerConnection sharedPackagerConnection] addHandler:handler forMethod:name];
#endif
}

- (void)setupHMRClientWithBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) {
    NSURLComponents *urlComponents = [[NSURLComponents alloc] initWithURL:bundleURL resolvingAgainstBaseURL:NO];
    NSString *const path = [urlComponents.path substringFromIndex:1]; // Strip initial slash.
    NSString *const host = urlComponents.host;
    NSNumber *const port = urlComponents.port;
    NSString *const scheme = urlComponents.scheme;
    BOOL isHotLoadingEnabled = self.isHotLoadingEnabled;
    if (self.callableJSModules) {
      [self.callableJSModules invokeModule:@"HMRClient"
                                    method:@"setup"
                                  withArgs:@[ @"ios", path, host, ABI49_0_0RCTNullIfNil(port), @(isHotLoadingEnabled), scheme ]];
    }
  }
}

- (void)setupHMRClientWithAdditionalBundleURL:(NSURL *)bundleURL
{
  if (bundleURL && !bundleURL.fileURL) { // isHotLoadingAvailable check
    if (self.callableJSModules) {
      [self.callableJSModules invokeModule:@"HMRClient"
                                    method:@"registerBundle"
                                  withArgs:@[ [bundleURL absoluteString] ]];
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
  // In bridge mode, the bridge that sent the notif must be the same as the one stored in this module.
  // In bridgless mode, we don't care about this.
  if ([notification.name isEqualToString:ABI49_0_0RCTJavaScriptDidLoadNotification] &&
      notification.userInfo[@"bridge"] != self.bridge) {
    return;
  }

  _isJSLoaded = YES;
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    // update state again after the bridge has finished loading
    [strongSelf _synchronizeAllSettings];

    // Inspector can only be shown after JS has loaded
    if ([strongSelf isElementInspectorShown]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [[strongSelf.moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"toggleElementInspector"
                                                                                      body:nil];
#pragma clang diagnostic pop
    }
  });
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeDevSettingsSpecJSI>(params);
}

@end

#else // #if ABI49_0_0RCT_DEV_MENU

@interface ABI49_0_0RCTDevSettings () <ABI49_0_0NativeDevSettingsSpec>
@end

@implementation ABI49_0_0RCTDevSettings

- (instancetype)initWithDataSource:(id<ABI49_0_0RCTDevSettingsDataSource>)dataSource
{
  return [super init];
}
- (void)initialize
{
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

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeDevSettingsSpecJSI>(params);
}

@end

#endif // #if ABI49_0_0RCT_DEV_MENU

@implementation ABI49_0_0RCTBridge (ABI49_0_0RCTDevSettings)

- (ABI49_0_0RCTDevSettings *)devSettings
{
#if ABI49_0_0RCT_REMOTE_PROFILE
  return [self moduleForClass:[ABI49_0_0RCTDevSettings class]];
#elif ABI49_0_0RCT_DEV_MENU
  return devSettingsMenuEnabled ? [self moduleForClass:[ABI49_0_0RCTDevSettings class]] : nil;
#else
  return nil;
#endif
}

@end

Class ABI49_0_0RCTDevSettingsCls(void)
{
  return ABI49_0_0RCTDevSettings.class;
}
