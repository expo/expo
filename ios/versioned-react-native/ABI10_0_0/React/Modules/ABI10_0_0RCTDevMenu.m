/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTDevMenu.h"

#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTBridge+Private.h"
#import "ABI10_0_0RCTDefines.h"
#import "ABI10_0_0RCTEventDispatcher.h"
#import "ABI10_0_0RCTKeyCommands.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTProfile.h"
#import "ABI10_0_0RCTRootView.h"
#import "ABI10_0_0RCTSourceCode.h"
#import "ABI10_0_0RCTUtils.h"
#import "ABI10_0_0RCTWebSocketProxy.h"

#if ABI10_0_0RCT_DEV

static NSString *const ABI10_0_0RCTShowDevMenuNotification = @"ABI10_0_0RCTShowDevMenuNotification";
static NSString *const ABI10_0_0RCTDevMenuSettingsKey = @"ABI10_0_0RCTDevMenu";

@implementation UIWindow (ABI10_0_0RCTDevMenu)

- (void)ABI10_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI10_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

typedef NS_ENUM(NSInteger, ABI10_0_0RCTDevMenuType) {
  ABI10_0_0RCTDevMenuTypeButton,
  ABI10_0_0RCTDevMenuTypeToggle
};

@interface ABI10_0_0RCTDevMenuItem ()

@property (nonatomic, assign, readonly) ABI10_0_0RCTDevMenuType type;
@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *selectedTitle;
@property (nonatomic, copy) id value;

@end

@implementation ABI10_0_0RCTDevMenuItem
{
  id _handler; // block
}

- (instancetype)initWithType:(ABI10_0_0RCTDevMenuType)type
                         key:(NSString *)key
                       title:(NSString *)title
               selectedTitle:(NSString *)selectedTitle
                     handler:(id /* block */)handler
{
  if ((self = [super init])) {
    _type = type;
    _key = [key copy];
    _title = [title copy];
    _selectedTitle = [selectedTitle copy];
    _handler = [handler copy];
    _value = nil;
  }
  return self;
}

ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(void (^)(void))handler
{
  return [[self alloc] initWithType:ABI10_0_0RCTDevMenuTypeButton
                                key:nil
                              title:title
                      selectedTitle:nil
                            handler:handler];
}

+ (instancetype)toggleItemWithKey:(NSString *)key
                            title:(NSString *)title
                    selectedTitle:(NSString *)selectedTitle
                          handler:(void (^)(BOOL selected))handler
{
  return [[self alloc] initWithType:ABI10_0_0RCTDevMenuTypeToggle
                                key:key
                              title:title
                      selectedTitle:selectedTitle
                            handler:handler];
}

- (void)callHandler
{
  switch (_type) {
    case ABI10_0_0RCTDevMenuTypeButton: {
      if (_handler) {
        ((void(^)())_handler)();
      }
      break;
    }
    case ABI10_0_0RCTDevMenuTypeToggle: {
      if (_handler) {
        ((void(^)(BOOL selected))_handler)([_value boolValue]);
      }
      break;
    }
  }
}

@end

@interface ABI10_0_0RCTDevMenu () <ABI10_0_0RCTBridgeModule, UIActionSheetDelegate, ABI10_0_0RCTInvalidating, ABI10_0_0RCTWebSocketProxyDelegate>

@property (nonatomic, strong) Class executorClass;

@end

@implementation ABI10_0_0RCTDevMenu
{
  UIActionSheet *_actionSheet;
  NSUserDefaults *_defaults;
  NSMutableDictionary *_settings;
  NSURLSessionDataTask *_updateTask;
  NSURL *_liveReloadURL;
  BOOL _jsLoaded;
  NSArray<ABI10_0_0RCTDevMenuItem *> *_presentedItems;
  NSMutableArray<ABI10_0_0RCTDevMenuItem *> *_extraMenuItems;
  NSString *_webSocketExecutorName;
  NSString *_executorOverride;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI10_0_0RCTDevMenu"; }

- (instancetype)init
{
  if ((self = [super init])) {

    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

    [notificationCenter addObserver:self
                           selector:@selector(showOnShake)
                               name:ABI10_0_0RCTShowDevMenuNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(settingsDidChange)
                               name:NSUserDefaultsDidChangeNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(jsLoaded:)
                               name:ABI10_0_0RCTJavaScriptDidLoadNotification
                             object:nil];

    _defaults = [NSUserDefaults standardUserDefaults];
    _settings = [[NSMutableDictionary alloc] initWithDictionary:[_defaults objectForKey:ABI10_0_0RCTDevMenuSettingsKey]];
    _extraMenuItems = [NSMutableArray new];

    __weak ABI10_0_0RCTDevMenu *weakSelf = self;

    [_extraMenuItems addObject:[ABI10_0_0RCTDevMenuItem toggleItemWithKey:@"showInspector"
                                                 title:@"Show Inspector"
                                         selectedTitle:@"Hide Inspector"
                                               handler:^(__unused BOOL enabled)
    {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [weakSelf.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
    }]];

    _webSocketExecutorName = [_defaults objectForKey:@"websocket-executor-name"] ?: @"JS Remotely";

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      self->_executorOverride = [self->_defaults objectForKey:@"executor-override"];
    });

    // Delay setup until after Bridge init
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf updateSettings:self->_settings];
      [weakSelf connectPackager];
    });
  }
  return self;
}

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

// TODO: Move non-UI logic into separate ABI10_0_0RCTDevSettings module
- (void)connectPackager
{
  Class webSocketManagerClass = NSClassFromString(@"ABI10_0_0RCTWebSocketManager");
  id<ABI10_0_0RCTWebSocketProxy> webSocketManager = (id <ABI10_0_0RCTWebSocketProxy>)[webSocketManagerClass sharedInstance];
  NSURL *url = [self packagerURL];
  if (url) {
    [webSocketManager setDelegate:self forURL:url];
  }
}

- (BOOL)isSupportedVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @1 ];
  return [kSupportedVersions containsObject:version];
}

- (void)socketProxy:(__unused id<ABI10_0_0RCTWebSocketProxy>)sender didReceiveMessage:(NSDictionary<NSString *, id> *)message
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
        _bridge.executorClass = NSClassFromString(@"ABI10_0_0RCTWebSocketExecutor");
      }
      [_bridge reload];
    }
  }
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)settingsDidChange
{
  // Needed to prevent a race condition when reloading
  __weak ABI10_0_0RCTDevMenu *weakSelf = self;
  NSDictionary *settings = [_defaults objectForKey:ABI10_0_0RCTDevMenuSettingsKey];
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf updateSettings:settings];
  });
}

/**
 * This method loads the settings from NSUserDefaults and overrides any local
 * settings with them. It should only be called on app launch, or after the app
 * has returned from the background, when the settings might have been edited
 * outside of the app.
 */
- (void)updateSettings:(NSDictionary *)settings
{
  [_settings setDictionary:settings];

  // Fire handlers for items whose values have changed
  for (ABI10_0_0RCTDevMenuItem *item in _extraMenuItems) {
    if (item.key) {
      id value = settings[item.key];
      if (value != item.value && ![value isEqual:item.value]) {
        item.value = value;
        [item callHandler];
      }
    }
  }

  self.shakeToShow = [_settings[@"shakeToShow"] ?: @YES boolValue];
  self.profilingEnabled = [_settings[@"profilingEnabled"] ?: @NO boolValue];
  self.liveReloadEnabled = [_settings[@"liveReloadEnabled"] ?: @YES boolValue];
  self.hotLoadingEnabled = [_settings[@"hotLoadingEnabled"] ?: @NO boolValue];
  self.showFPS = [_settings[@"showFPS"] ?: @NO boolValue];
  self.executorClass = NSClassFromString(_executorOverride ?: _settings[@"executorClass"]);
}

/**
 * This updates a particular setting, and then saves the settings. Because all
 * settings are overwritten by this, it's important that this is not called
 * before settings have been loaded initially, otherwise the other settings
 * will be reset.
 */
- (void)updateSetting:(NSString *)name value:(id)value
{
  // Fire handler for item whose values has changed
  for (ABI10_0_0RCTDevMenuItem *item in _extraMenuItems) {
    if ([item.key isEqualToString:name]) {
      if (value != item.value && ![value isEqual:item.value]) {
        item.value = value;
        [item callHandler];
      }
      break;
    }
  }

  // Save the setting
  id currentValue = _settings[name];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[name] = value;
  } else {
    [_settings removeObjectForKey:name];
  }
  [_defaults setObject:_settings forKey:ABI10_0_0RCTDevMenuSettingsKey];
  [_defaults synchronize];
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }

  _jsLoaded = YES;

  // Check if live reloading is available
  _liveReloadURL = nil;
  ABI10_0_0RCTSourceCode *sourceCodeModule = [_bridge moduleForClass:[ABI10_0_0RCTSourceCode class]];
  if (!sourceCodeModule.scriptURL) {
    if (!sourceCodeModule) {
      ABI10_0_0RCTLogWarn(@"ABI10_0_0RCTSourceCode module not found");
    } else if (!ABI10_0_0RCTRunningInTestEnvironment()) {
      ABI10_0_0RCTLogWarn(@"ABI10_0_0RCTSourceCode module scriptURL has not been set");
    }
  } else if (!sourceCodeModule.scriptURL.fileURL) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:sourceCodeModule.scriptURL];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // Hit these setters again after bridge has finished loading
    self.profilingEnabled = self->_profilingEnabled;
    self.liveReloadEnabled = self->_liveReloadEnabled;
    self.executorClass = self->_executorClass;

    // Inspector can only be shown after JS has loaded
    if ([self->_settings[@"showInspector"] boolValue]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
#pragma clang diagnostic pop
    }
  });
}

- (void)invalidate
{
  _presentedItems = nil;
  [_updateTask cancel];
  [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)showOnShake
{
  if (_shakeToShow) {
    [self show];
  }
}

- (void)toggle
{
  if (_actionSheet) {
    [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (void)addItem:(NSString *)title handler:(void(^)(void))handler
{
  [self addItem:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI10_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];

  // Fire handler for items whose saved value doesn't match the default
  [self settingsDidChange];
}

- (NSArray<ABI10_0_0RCTDevMenuItem *> *)menuItems
{
  NSMutableArray<ABI10_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items

  __weak ABI10_0_0RCTDevMenu *weakSelf = self;

  [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [weakSelf reload];
  }]];

  Class jsDebuggingExecutorClass = NSClassFromString(@"ABI10_0_0RCTWebSocketExecutor");
  if (!jsDebuggingExecutorClass) {
    [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", _webSocketExecutorName] handler:^{
      UIAlertView *alert = ABI10_0_0RCTAlertView(
        [NSString stringWithFormat:@"%@ Debugger Unavailable", self->_webSocketExecutorName],
        [NSString stringWithFormat:@"You need to include the ABI10_0_0RCTWebSocket library to enable %@ debugging", self->_webSocketExecutorName],
        nil,
        @"OK",
        nil);
      [alert show];
    }]];
  } else {
    BOOL isDebuggingJS = _executorClass && _executorClass == jsDebuggingExecutorClass;
    NSString *debuggingDescription = [_defaults objectForKey:@"websocket-executor-name"] ?: @"Remote JS";
    NSString *debugTitleJS = isDebuggingJS ? [NSString stringWithFormat:@"Stop %@ Debugging", debuggingDescription] : [NSString stringWithFormat:@"Debug %@", _webSocketExecutorName];
    [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:debugTitleJS handler:^{
      weakSelf.executorClass = isDebuggingJS ? Nil : jsDebuggingExecutorClass;
    }]];
  }

  if (_liveReloadURL) {
    NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:liveReloadTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.liveReloadEnabled = !strongSelf->_liveReloadEnabled;
      }
    }]];

    NSString *profilingTitle  = ABI10_0_0RCTProfileIsProfiling() ? @"Stop Systrace" : @"Start Systrace";
    [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:profilingTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.profilingEnabled = !strongSelf->_profilingEnabled;
      }
    }]];
  }

  if ([self hotLoadingAvailable]) {
    NSString *hotLoadingTitle = _hotLoadingEnabled ? @"Disable Hot Reloading" : @"Enable Hot Reloading";
    [items addObject:[ABI10_0_0RCTDevMenuItem buttonItemWithTitle:hotLoadingTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.hotLoadingEnabled = !strongSelf->_hotLoadingEnabled;
      }
    }]];
  }

  [items addObjectsFromArray:_extraMenuItems];

  return items;
}

ABI10_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge || ABI10_0_0RCTRunningInAppExtension()) {
    return;
  }

  UIActionSheet *actionSheet = [UIActionSheet new];
  actionSheet.title = @"ReactABI10_0_0 Native: Development";
  actionSheet.delegate = self;

  NSArray<ABI10_0_0RCTDevMenuItem *> *items = [self menuItems];
  for (ABI10_0_0RCTDevMenuItem *item in items) {
    switch (item.type) {
      case ABI10_0_0RCTDevMenuTypeButton: {
        [actionSheet addButtonWithTitle:item.title];
        break;
      }
      case ABI10_0_0RCTDevMenuTypeToggle: {
        BOOL selected = [item.value boolValue];
        [actionSheet addButtonWithTitle:selected? item.selectedTitle : item.title];
        break;
      }
    }
  }

  [actionSheet addButtonWithTitle:@"Cancel"];
  actionSheet.cancelButtonIndex = actionSheet.numberOfButtons - 1;

  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:ABI10_0_0RCTKeyWindow().rootViewController.view];
  _actionSheet = actionSheet;
  _presentedItems = items;
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  _actionSheet = nil;
  if (buttonIndex == actionSheet.cancelButtonIndex) {
    return;
  }

  ABI10_0_0RCTDevMenuItem *item = _presentedItems[buttonIndex];
  switch (item.type) {
    case ABI10_0_0RCTDevMenuTypeButton: {
      [item callHandler];
      break;
    }
    case ABI10_0_0RCTDevMenuTypeToggle: {
      BOOL value = [_settings[item.key] boolValue];
      [self updateSetting:item.key value:@(!value)]; // will call handler
      break;
    }
  }
  return;
}

ABI10_0_0RCT_EXPORT_METHOD(reload)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI10_0_0RCTReloadNotification
                                                      object:_bridge.baseBridge
                                                    userInfo:nil];
}

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _shakeToShow = shakeToShow;
  [self updateSetting:@"shakeToShow" value:@(_shakeToShow)];
}

- (void)setProfilingEnabled:(BOOL)enabled
{
  _profilingEnabled = enabled;
  [self updateSetting:@"profilingEnabled" value:@(_profilingEnabled)];

  if (_liveReloadURL && enabled != ABI10_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling:^(NSData *logData) {
        ABI10_0_0RCTProfileSendResult(self->_bridge, @"systrace", logData);
      }];
    }
  }
}

- (void)setLiveReloadEnabled:(BOOL)enabled
{
  _liveReloadEnabled = enabled;
  [self updateSetting:@"liveReloadEnabled" value:@(_liveReloadEnabled)];

  if (_liveReloadEnabled) {
    [self checkForUpdates];
  } else {
    [_updateTask cancel];
    _updateTask = nil;
  }
}

- (BOOL)hotLoadingAvailable
{
  return _bridge.bundleURL && !_bridge.bundleURL.fileURL; // Only works when running from server
}

- (void)setHotLoadingEnabled:(BOOL)enabled
{
  _hotLoadingEnabled = enabled;
  [self updateSetting:@"hotLoadingEnabled" value:@(_hotLoadingEnabled)];

  BOOL actuallyEnabled = [self hotLoadingAvailable] && _hotLoadingEnabled;
  if (ABI10_0_0RCTGetURLQueryParam(_bridge.bundleURL, @"hot").boolValue != actuallyEnabled) {
    _bridge.bundleURL = ABI10_0_0RCTURLByReplacingQueryParam(_bridge.bundleURL, @"hot",
                                                    actuallyEnabled ? @"true" : nil);
    [_bridge reload];
  }
}

- (void)setExecutorClass:(Class)executorClass
{
  if (_executorClass != executorClass) {
    _executorClass = executorClass;
    _executorOverride = nil;
    [self updateSetting:@"executorClass" value:NSStringFromClass(executorClass)];
  }

  if (_bridge.executorClass != executorClass) {

    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil &&
        _bridge.executorClass != NSClassFromString(@"ABI10_0_0RCTWebSocketExecutor")) {
      return;
    }

    _bridge.executorClass = executorClass;
    [_bridge reload];
  }
}

- (void)setShowFPS:(BOOL)showFPS
{
  _showFPS = showFPS;
  [self updateSetting:@"showFPS" value:@(showFPS)];
}

- (void)checkForUpdates
{
  if (!_jsLoaded || !_liveReloadEnabled || !_liveReloadURL) {
    return;
  }

  if (_updateTask) {
    return;
  }

  __weak ABI10_0_0RCTDevMenu *weakSelf = self;
  _updateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:
                 ^(__unused NSData *data, NSURLResponse *response, NSError *error) {

    dispatch_async(dispatch_get_main_queue(), ^{
      ABI10_0_0RCTDevMenu *strongSelf = weakSelf;
      if (strongSelf && strongSelf->_liveReloadEnabled) {
        NSHTTPURLResponse *HTTPResponse = (NSHTTPURLResponse *)response;
        if (!error && HTTPResponse.statusCode == 205) {
          [strongSelf reload];
        } else {
          if (error.code != NSURLErrorCancelled) {
            strongSelf->_updateTask = nil;
            [strongSelf checkForUpdates];
          }
        }
      }
    });

  }];

  [_updateTask resume];
}

@end

#else // Unavailable when not in dev mode

@implementation ABI10_0_0RCTDevMenu

- (void)show {}
- (void)reload {}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(ABI10_0_0RCTDevMenu *)item {}

@end

#endif

@implementation  ABI10_0_0RCTBridge (ABI10_0_0RCTDevMenu)

- (ABI10_0_0RCTDevMenu *)devMenu
{
#if ABI10_0_0RCT_DEV
  return [self moduleForClass:[ABI10_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end
