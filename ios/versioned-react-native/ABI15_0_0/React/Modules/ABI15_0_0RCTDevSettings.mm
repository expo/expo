/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTDevSettings.h"

#import <objc/runtime.h>

#import <JavaScriptCore/JavaScriptCore.h>

#import <ABI15_0_0jschelpers/ABI15_0_0JavaScriptCore.h>

#import "ABI15_0_0JSCSamplingProfiler.h"
#import "ABI15_0_0RCTBridge+Private.h"
#import "ABI15_0_0RCTBridgeModule.h"
#import "ABI15_0_0RCTDevMenu.h"
#import "ABI15_0_0RCTEventDispatcher.h"
#import "ABI15_0_0RCTLog.h"
#import "ABI15_0_0RCTProfile.h"
#import "ABI15_0_0RCTUtils.h"
#import "ABI15_0_0RCTWebSocketObserverProtocol.h"

NSString *const kABI15_0_0RCTDevSettingProfilingEnabled = @"profilingEnabled";
NSString *const kABI15_0_0RCTDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
NSString *const kABI15_0_0RCTDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const kABI15_0_0RCTDevSettingIsInspectorShown = @"showInspector";
NSString *const kABI15_0_0RCTDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";
NSString *const kABI15_0_0RCTDevSettingWebsocketExecutorName = @"websocket-executor-name";
NSString *const kABI15_0_0RCTDevSettingExecutorOverrideClass = @"executor-override";
NSString *const kABI15_0_0RCTDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const kABI15_0_0RCTDevSettingIsPerfMonitorShown = @"ABI15_0_0RCTPerfMonitorKey";
NSString *const kABI15_0_0RCTDevSettingIsJSCProfilingEnabled = @"ABI15_0_0RCTJSCProfilerEnabled";
NSString *const kABI15_0_0RCTDevSettingStartSamplingProfilerOnLaunch = @"startSamplingProfilerOnLaunch";

NSString *const kABI15_0_0RCTDevSettingsUserDefaultsKey = @"ABI15_0_0RCTDevMenu";

#if ABI15_0_0RCT_DEV

@interface ABI15_0_0RCTDevSettingsUserDefaultsDataSource : NSObject <ABI15_0_0RCTDevSettingsDataSource>

@end

@implementation ABI15_0_0RCTDevSettingsUserDefaultsDataSource {
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
  ABI15_0_0RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:kABI15_0_0RCTDevSettingsUserDefaultsKey];
}

- (id)settingForKey:(NSString *)key
{
  return _settings[key];
}

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSDictionary *existingSettings = [_userDefaults objectForKey:kABI15_0_0RCTDevSettingsUserDefaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:kABI15_0_0RCTDevSettingsUserDefaultsKey];
}

@end

@interface ABI15_0_0RCTDevSettings () <ABI15_0_0RCTBridgeModule, ABI15_0_0RCTInvalidating, ABI15_0_0RCTWebSocketObserverDelegate>
{
  NSURLSessionDataTask *_liveReloadUpdateTask;
  NSURL *_liveReloadURL;
  BOOL _isJSLoaded;
}

@property (nonatomic, strong) Class executorClass;
@property (nonatomic, readwrite, strong) id<ABI15_0_0RCTDevSettingsDataSource> dataSource;

@end

@implementation ABI15_0_0RCTDevSettings

@synthesize bridge = _bridge;

ABI15_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  // default behavior is to use NSUserDefaults
  NSDictionary *defaultValues = @{
    kABI15_0_0RCTDevSettingShakeToShowDevMenu: @YES,
  };
  ABI15_0_0RCTDevSettingsUserDefaultsDataSource *dataSource = [[ABI15_0_0RCTDevSettingsUserDefaultsDataSource alloc] initWithDefaultValues:defaultValues];
  return [self initWithDataSource:dataSource];
}

- (instancetype)initWithDataSource:(id<ABI15_0_0RCTDevSettingsDataSource>)dataSource
{
  if (self = [super init]) {
    _dataSource = dataSource;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(jsLoaded:)
                                                 name:ABI15_0_0RCTJavaScriptDidLoadNotification
                                               object:nil];

    // Delay setup until after Bridge init
    dispatch_async(dispatch_get_main_queue(), ^{
      [self _synchronizeAllSettings];
      [self connectPackager];
    });
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [_liveReloadUpdateTask cancel];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)_updateSettingWithValue:(id)value forKey:(NSString *)key
{
  [_dataSource updateSettingWithValue:value forKey:key];
}

- (id)settingForKey:(NSString *)key
{
  return [_dataSource settingForKey:key];
}

- (BOOL)isRemoteDebuggingAvailable
{
  Class jsDebuggingExecutorClass = objc_lookUpClass("ABI15_0_0RCTWebSocketExecutor");
  return (jsDebuggingExecutorClass != nil);
}

- (BOOL)isHotLoadingAvailable
{
  return _bridge.bundleURL && !_bridge.bundleURL.fileURL; // Only works when running from server
}

- (BOOL)isLiveReloadAvailable
{
  return (_liveReloadURL != nil);
}

- (BOOL)isJSCSamplingProfilerAvailable
{
  return JSC_JSSamplingProfilerEnabled(_bridge.jsContext.JSGlobalContextRef);
}

ABI15_0_0RCT_EXPORT_METHOD(reload)
{
  [_bridge reload];
}

- (NSString *)websocketExecutorName
{
  // This value is passed as a command-line argument, so fall back to reading from NSUserDefaults directly
  return [[NSUserDefaults standardUserDefaults] stringForKey:kABI15_0_0RCTDevSettingWebsocketExecutorName];
}

- (void)setIsShakeToShowDevMenuEnabled:(BOOL)isShakeToShowDevMenuEnabled
{
  [self _updateSettingWithValue:@(isShakeToShowDevMenuEnabled) forKey:kABI15_0_0RCTDevSettingShakeToShowDevMenu];
}

- (BOOL)isShakeToShowDevMenuEnabled
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingShakeToShowDevMenu] boolValue];
}

ABI15_0_0RCT_EXPORT_METHOD(setIsDebuggingRemotely:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI15_0_0RCTDevSettingIsDebuggingRemotely];
  [self _remoteDebugSettingDidChange];
}

- (BOOL)isDebuggingRemotely
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingIsDebuggingRemotely] boolValue];
}

- (void)_remoteDebugSettingDidChange
{
  // This value is passed as a command-line argument, so fall back to reading from NSUserDefaults directly
  NSString *executorOverride = [[NSUserDefaults standardUserDefaults] stringForKey:kABI15_0_0RCTDevSettingExecutorOverrideClass];
  if (executorOverride) {
    self.executorClass = NSClassFromString(executorOverride);
  } else {
    BOOL enabled = self.isRemoteDebuggingAvailable && self.isDebuggingRemotely;
    self.executorClass = enabled ? objc_getClass("ABI15_0_0RCTWebSocketExecutor") : nil;
  }
}

ABI15_0_0RCT_EXPORT_METHOD(setProfilingEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI15_0_0RCTDevSettingProfilingEnabled];
  [self _profilingSettingDidChange];
}

- (BOOL)isProfilingEnabled
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingProfilingEnabled] boolValue];
}

- (void)_profilingSettingDidChange
{
  BOOL enabled = self.isProfilingEnabled;
  if (_liveReloadURL && enabled != ABI15_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling:^(NSData *logData) {
        ABI15_0_0RCTProfileSendResult(self->_bridge, @"systrace", logData);
      }];
    }
  }
}

ABI15_0_0RCT_EXPORT_METHOD(setLiveReloadEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI15_0_0RCTDevSettingLiveReloadEnabled];
  [self _liveReloadSettingDidChange];
}

- (BOOL)isLiveReloadEnabled
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingLiveReloadEnabled] boolValue];
}

- (void)_liveReloadSettingDidChange
{
  BOOL liveReloadEnabled = (self.isLiveReloadAvailable && self.isLiveReloadEnabled);
  if (liveReloadEnabled) {
    [self _pollForLiveReload];
  } else {
    [_liveReloadUpdateTask cancel];
    _liveReloadUpdateTask = nil;
  }
}

ABI15_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled:(BOOL)enabled)
{
  [self _updateSettingWithValue:@(enabled) forKey:kABI15_0_0RCTDevSettingHotLoadingEnabled];
  [self _hotLoadingSettingDidChange];
}

- (BOOL)isHotLoadingEnabled
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingHotLoadingEnabled] boolValue];
}

- (void)_hotLoadingSettingDidChange
{
  BOOL hotLoadingEnabled = self.isHotLoadingAvailable && self.isHotLoadingEnabled;
  if (ABI15_0_0RCTGetURLQueryParam(_bridge.bundleURL, @"hot").boolValue != hotLoadingEnabled) {
    _bridge.bundleURL = ABI15_0_0RCTURLByReplacingQueryParam(_bridge.bundleURL, @"hot",
                                                    hotLoadingEnabled ? @"true" : nil);
    [_bridge reload];
  }
}

ABI15_0_0RCT_EXPORT_METHOD(toggleElementInspector)
{
  BOOL value = [[self settingForKey:kABI15_0_0RCTDevSettingIsInspectorShown] boolValue];
  [self _updateSettingWithValue:@(!value) forKey:kABI15_0_0RCTDevSettingIsInspectorShown];

  if (_isJSLoaded) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
  }
}

- (void)toggleJSCSamplingProfiler
{
  JSContext *context = _bridge.jsContext;
  JSGlobalContextRef globalContext = context.JSGlobalContextRef;
  // JSPokeSamplingProfiler() toggles the profiling process
  JSValueRef jsResult = JSC_JSPokeSamplingProfiler(globalContext);

  if (JSC_JSValueGetType(globalContext, jsResult) != kJSTypeNull) {
    NSString *results = [[JSC_JSValue(globalContext) valueWithJSValueRef:jsResult inContext:context] toObject];
    ABI15_0_0JSCSamplingProfiler *profilerModule = [_bridge moduleForClass:[ABI15_0_0JSCSamplingProfiler class]];
    [profilerModule operationCompletedWithResults:results];
  }
}

- (BOOL)isElementInspectorShown
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingIsInspectorShown] boolValue];
}

- (void)setIsPerfMonitorShown:(BOOL)isPerfMonitorShown
{
  [self _updateSettingWithValue:@(isPerfMonitorShown) forKey:kABI15_0_0RCTDevSettingIsPerfMonitorShown];
}

- (BOOL)isPerfMonitorShown
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingIsPerfMonitorShown] boolValue];
}

- (void)setIsJSCProfilingEnabled:(BOOL)isJSCProfilingEnabled
{
  [self _updateSettingWithValue:@(isJSCProfilingEnabled) forKey:kABI15_0_0RCTDevSettingIsJSCProfilingEnabled];
}

- (BOOL)isJSCProfilingEnabled
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingIsJSCProfilingEnabled] boolValue];
}

- (void)setStartSamplingProfilerOnLaunch:(BOOL)startSamplingProfilerOnLaunch
{
  [self _updateSettingWithValue:@(startSamplingProfilerOnLaunch) forKey:kABI15_0_0RCTDevSettingStartSamplingProfilerOnLaunch];
}

- (BOOL)startSamplingProfilerOnLaunch
{
  return [[self settingForKey:kABI15_0_0RCTDevSettingStartSamplingProfilerOnLaunch] boolValue];
}

- (void)setExecutorClass:(Class)executorClass
{
  _executorClass = executorClass;
  if (_bridge.executorClass != executorClass) {

    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil &&
        _bridge.executorClass != objc_lookUpClass("ABI15_0_0RCTWebSocketExecutor")) {
      return;
    }

    _bridge.executorClass = executorClass;
    [_bridge reload];
  }
}

#pragma mark - internal

/**
 *  Query the data source for all possible settings and make sure we're doing the right
 *  thing for the state of each setting.
 */
- (void)_synchronizeAllSettings
{
  [self _hotLoadingSettingDidChange];
  [self _liveReloadSettingDidChange];
  [self _remoteDebugSettingDidChange];
  [self _profilingSettingDidChange];
}

- (void)_pollForLiveReload
{
  if (!_isJSLoaded || ![[self settingForKey:kABI15_0_0RCTDevSettingLiveReloadEnabled] boolValue] || !_liveReloadURL) {
    return;
  }

  if (_liveReloadUpdateTask) {
    return;
  }

  __weak ABI15_0_0RCTDevSettings *weakSelf = self;
  _liveReloadUpdateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:
                           ^(__unused NSData *data, NSURLResponse *response, NSError *error) {

                             dispatch_async(dispatch_get_main_queue(), ^{
                               __strong ABI15_0_0RCTDevSettings *strongSelf = weakSelf;
                               if (strongSelf && [[strongSelf settingForKey:kABI15_0_0RCTDevSettingLiveReloadEnabled] boolValue]) {
                                 NSHTTPURLResponse *HTTPResponse = (NSHTTPURLResponse *)response;
                                 if (!error && HTTPResponse.statusCode == 205) {
                                   [strongSelf reload];
                                 } else {
                                   if (error.code != NSURLErrorCancelled) {
                                     strongSelf->_liveReloadUpdateTask = nil;
                                     [strongSelf _pollForLiveReload];
                                   }
                                 }
                               }
                             });

                           }];

  [_liveReloadUpdateTask resume];
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }

  _isJSLoaded = YES;

  // Check if live reloading is available
  NSURL *scriptURL = _bridge.bundleURL;
  if (![scriptURL isFileURL]) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:scriptURL];
  } else {
    _liveReloadURL = nil;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // update state again after the bridge has finished loading
    [self _synchronizeAllSettings];
  });
}

#pragma mark - ABI15_0_0RCTWebSocketObserver

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  NSString *scheme = [_bridge.bundleURL scheme];
  if (!host) {
    host = @"localhost";
    scheme = @"http";
  }

  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=shell", scheme, host, port]];
}

// TODO: Move non-UI logic into separate ABI15_0_0RCTDevSettings module
- (void)connectPackager
{
  ABI15_0_0RCTAssertMainQueue();

  NSURL *url = [self packagerURL];
  if (!url) {
    return;
  }

  Class webSocketObserverClass = objc_lookUpClass("ABI15_0_0RCTWebSocketObserver");
  if (webSocketObserverClass == Nil) {
    return;
  }

  // If multiple ABI15_0_0RCTDevMenus are created, the most recently connected one steals the ABI15_0_0RCTWebSocketObserver.
  // (Why this behavior exists is beyond me, as of this writing.)
  static NSMutableDictionary<NSString *, id<ABI15_0_0RCTWebSocketObserver>> *observers = nil;
  if (observers == nil) {
    observers = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  id<ABI15_0_0RCTWebSocketObserver> existingObserver = observers[key];
  if (existingObserver) {
    existingObserver.delegate = self;
  } else {
    id<ABI15_0_0RCTWebSocketObserver> newObserver = [(id<ABI15_0_0RCTWebSocketObserver>)[webSocketObserverClass alloc] initWithURL:url];
    newObserver.delegate = self;
    [newObserver start];
    observers[key] = newObserver;
  }
}

- (BOOL)isSupportedVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @1 ];
  return [kSupportedVersions containsObject:version];
}

- (void)didReceiveWebSocketMessage:(NSDictionary<NSString *, id> *)message
{
  if ([self isSupportedVersion:message[@"version"]]) {
    [self processTarget:message[@"target"] action:message[@"action"] options:message[@"options"]];
  }
}

- (void)processTarget:(NSString *)target action:(NSString *)action options:(NSDictionary<NSString *, id> *)options
{
  if ([target isEqualToString:@"bridge"]) {
    if ([action isEqualToString:@"reload"]) {
      if ([options[@"debug"] boolValue]) {
        _bridge.executorClass = objc_lookUpClass("ABI15_0_0RCTWebSocketExecutor");
      }
      [_bridge reload];
    }
  }
}

@end

#else // #if ABI15_0_0RCT_DEV

@implementation ABI15_0_0RCTDevSettings

- (instancetype)initWithDataSource:(id<ABI15_0_0RCTDevSettingsDataSource>)dataSource { return [super init]; }
- (BOOL)isHotLoadingAvailable { return NO; }
- (BOOL)isLiveReloadAvailable { return NO; }
- (BOOL)isRemoteDebuggingAvailable { return NO; }
- (id)settingForKey:(NSString *)key { return nil; }
- (void)reload {}
- (void)toggleElementInspector {}
- (void)toggleJSCSamplingProfiler {}

@end

#endif

@implementation ABI15_0_0RCTBridge (ABI15_0_0RCTDevSettings)

- (ABI15_0_0RCTDevSettings *)devSettings
{
#if ABI15_0_0RCT_DEV
  return [self moduleForClass:[ABI15_0_0RCTDevSettings class]];
#else
  return nil;
#endif
}

@end
