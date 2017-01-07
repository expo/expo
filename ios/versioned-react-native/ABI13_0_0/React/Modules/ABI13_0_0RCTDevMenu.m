/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTDevMenu.h"

#import <objc/runtime.h>

#import "ABI13_0_0RCTAssert.h"
#import "ABI13_0_0RCTBridge+Private.h"
#import "ABI13_0_0RCTDefines.h"
#import "ABI13_0_0RCTEventDispatcher.h"
#import "ABI13_0_0RCTKeyCommands.h"
#import "ABI13_0_0RCTLog.h"
#import "ABI13_0_0RCTProfile.h"
#import "ABI13_0_0RCTRootView.h"
#import "ABI13_0_0RCTUtils.h"
#import "ABI13_0_0RCTWebSocketObserverProtocol.h"

#if ABI13_0_0RCT_DEV

static NSString *const ABI13_0_0RCTShowDevMenuNotification = @"ABI13_0_0RCTShowDevMenuNotification";
static NSString *const ABI13_0_0RCTDevMenuSettingsKey = @"ABI13_0_0RCTDevMenu";

@implementation UIWindow (ABI13_0_0RCTDevMenu)

- (void)ABI13_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI13_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

typedef NS_ENUM(NSInteger, ABI13_0_0RCTDevMenuType) {
  ABI13_0_0RCTDevMenuTypeButton,
  ABI13_0_0RCTDevMenuTypeToggle
};

@interface ABI13_0_0RCTDevMenuItem ()

@property (nonatomic, assign, readonly) ABI13_0_0RCTDevMenuType type;
@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, copy) id value;

@end

@implementation ABI13_0_0RCTDevMenuItem
{
  id _handler; // block

  NSString *_title;
  NSString *_selectedTitle;
}

- (instancetype)initWithType:(ABI13_0_0RCTDevMenuType)type
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

- (NSString *)title
{
  if (_type == ABI13_0_0RCTDevMenuTypeToggle && [_value boolValue]) {
    return _selectedTitle;
  }

  return _title;
}

ABI13_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(void (^)(void))handler
{
  return [[self alloc] initWithType:ABI13_0_0RCTDevMenuTypeButton
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
  return [[self alloc] initWithType:ABI13_0_0RCTDevMenuTypeToggle
                                key:key
                              title:title
                      selectedTitle:selectedTitle
                            handler:handler];
}

- (void)callHandler
{
  switch (_type) {
    case ABI13_0_0RCTDevMenuTypeButton: {
      if (_handler) {
        ((void(^)())_handler)();
      }
      break;
    }
    case ABI13_0_0RCTDevMenuTypeToggle: {
      if (_handler) {
        ((void(^)(BOOL selected))_handler)([_value boolValue]);
      }
      break;
    }
  }
}

@end

typedef void(^ABI13_0_0RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface ABI13_0_0RCTDevMenu () <ABI13_0_0RCTBridgeModule, ABI13_0_0RCTInvalidating, ABI13_0_0RCTWebSocketObserverDelegate>

@property (nonatomic, strong) Class executorClass;

@end

@implementation ABI13_0_0RCTDevMenu
{
  UIAlertController *_actionSheet;
  NSUserDefaults *_defaults;
  NSMutableDictionary *_settings;
  NSURLSessionDataTask *_updateTask;
  NSURL *_liveReloadURL;
  BOOL _jsLoaded;
  NSMutableArray<ABI13_0_0RCTDevMenuItem *> *_extraMenuItems;
  NSString *_webSocketExecutorName;
  NSString *_executorOverride;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI13_0_0RCTDevMenu"; }

+ (void)initialize
{
  // We're swizzling here because it's poor form to override methods in a category,
  // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
  // no need to call the original implementation.
  ABI13_0_0RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(ABI13_0_0RCT_motionEnded:withEvent:));
}

- (instancetype)init
{
  if ((self = [super init])) {

    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

    [notificationCenter addObserver:self
                           selector:@selector(showOnShake)
                               name:ABI13_0_0RCTShowDevMenuNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(settingsDidChange)
                               name:NSUserDefaultsDidChangeNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(jsLoaded:)
                               name:ABI13_0_0RCTJavaScriptDidLoadNotification
                             object:nil];

    _defaults = [NSUserDefaults standardUserDefaults];
    _settings = [[NSMutableDictionary alloc] initWithDictionary:[_defaults objectForKey:ABI13_0_0RCTDevMenuSettingsKey]];
    _extraMenuItems = [NSMutableArray new];

    __weak ABI13_0_0RCTDevMenu *weakSelf = self;

    [_extraMenuItems addObject:[ABI13_0_0RCTDevMenuItem toggleItemWithKey:@"showInspector"
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

#if TARGET_IPHONE_SIMULATOR

    ABI13_0_0RCTKeyCommands *commands = [ABI13_0_0RCTKeyCommands sharedInstance];

    // Toggle debug menu
    [commands registerKeyCommandWithInput:@"d"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf toggle];
                                   }];

    // Toggle element inspector
    [commands registerKeyCommandWithInput:@"i"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf.bridge.eventDispatcher
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
                                      sendDeviceEventWithName:@"toggleElementInspector"
                                      body:nil];
#pragma clang diagnostic pop
                                   }];

    // Reload in normal mode
    [commands registerKeyCommandWithInput:@"n"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     weakSelf.executorClass = Nil;
                                   }];
#endif

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

// TODO: Move non-UI logic into separate ABI13_0_0RCTDevSettings module
- (void)connectPackager
{
  ABI13_0_0RCTAssertMainQueue();

  NSURL *url = [self packagerURL];
  if (!url) {
    return;
  }

  Class webSocketObserverClass = objc_lookUpClass("ABI13_0_0RCTWebSocketObserver");
  if (webSocketObserverClass == Nil) {
    return;
  }

  // If multiple ABI13_0_0RCTDevMenus are created, the most recently connected one steals the ABI13_0_0RCTWebSocketObserver.
  // (Why this behavior exists is beyond me, as of this writing.)
  static NSMutableDictionary<NSString *, id<ABI13_0_0RCTWebSocketObserver>> *observers = nil;
  if (observers == nil) {
    observers = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  id<ABI13_0_0RCTWebSocketObserver> existingObserver = observers[key];
  if (existingObserver) {
    existingObserver.delegate = self;
  } else {
    id<ABI13_0_0RCTWebSocketObserver> newObserver = [(id<ABI13_0_0RCTWebSocketObserver>)[webSocketObserverClass alloc] initWithURL:url];
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
        _bridge.executorClass = objc_lookUpClass("ABI13_0_0RCTWebSocketExecutor");
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
  __weak ABI13_0_0RCTDevMenu *weakSelf = self;
  NSDictionary *settings = [_defaults objectForKey:ABI13_0_0RCTDevMenuSettingsKey];
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
  for (ABI13_0_0RCTDevMenuItem *item in _extraMenuItems) {
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
  for (ABI13_0_0RCTDevMenuItem *item in _extraMenuItems) {
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
  [_defaults setObject:_settings forKey:ABI13_0_0RCTDevMenuSettingsKey];
  [_defaults synchronize];
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }

  _jsLoaded = YES;

  // Check if live reloading is available
  NSURL *scriptURL = _bridge.bundleURL;
  if (![scriptURL isFileURL]) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:scriptURL];
  } else {
    _liveReloadURL = nil;
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
  [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
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
    [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (void)addItem:(NSString *)title handler:(void(^)(void))handler
{
  [self addItem:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI13_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];

  // Fire handler for items whose saved value doesn't match the default
  [self settingsDidChange];
}

- (NSArray<ABI13_0_0RCTDevMenuItem *> *)menuItems
{
  NSMutableArray<ABI13_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items

  __weak ABI13_0_0RCTDevMenu *weakSelf = self;

  [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [weakSelf reload];
  }]];

  Class jsDebuggingExecutorClass = objc_lookUpClass("ABI13_0_0RCTWebSocketExecutor");
  if (!jsDebuggingExecutorClass) {
    [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", _webSocketExecutorName] handler:^{
      UIAlertController *alertController = [UIAlertController alertControllerWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", self->_webSocketExecutorName]
                                                                               message:[NSString stringWithFormat:@"You need to include the ABI13_0_0RCTWebSocket library to enable %@ debugging", self->_webSocketExecutorName]
                                                                        preferredStyle:UIAlertControllerStyleAlert];

      [ABI13_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
    }]];
  } else {
    BOOL isDebuggingJS = _executorClass && _executorClass == jsDebuggingExecutorClass;
    NSString *debuggingDescription = [_defaults objectForKey:@"websocket-executor-name"] ?: @"Remote JS";
    NSString *debugTitleJS = isDebuggingJS ? [NSString stringWithFormat:@"Stop %@ Debugging", debuggingDescription] : [NSString stringWithFormat:@"Debug %@", _webSocketExecutorName];
    [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:debugTitleJS handler:^{
      weakSelf.executorClass = isDebuggingJS ? Nil : jsDebuggingExecutorClass;
    }]];
  }

  if (_liveReloadURL) {
    NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:liveReloadTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.liveReloadEnabled = !strongSelf->_liveReloadEnabled;
      }
    }]];

    NSString *profilingTitle  = ABI13_0_0RCTProfileIsProfiling() ? @"Stop Systrace" : @"Start Systrace";
    [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:profilingTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.profilingEnabled = !strongSelf->_profilingEnabled;
      }
    }]];
  }

  if ([self hotLoadingAvailable]) {
    NSString *hotLoadingTitle = _hotLoadingEnabled ? @"Disable Hot Reloading" : @"Enable Hot Reloading";
    [items addObject:[ABI13_0_0RCTDevMenuItem buttonItemWithTitle:hotLoadingTitle handler:^{
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.hotLoadingEnabled = !strongSelf->_hotLoadingEnabled;
      }
    }]];
  }

  [items addObjectsFromArray:_extraMenuItems];

  return items;
}

ABI13_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge || ABI13_0_0RCTRunningInAppExtension()) {
    return;
  }

  NSString *title = [NSString stringWithFormat:@"ReactABI13_0_0 Native: Development (%@)", [_bridge class]];
  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone ? UIAlertControllerStyleActionSheet : UIAlertControllerStyleAlert;
  _actionSheet = [UIAlertController alertControllerWithTitle:title
                                                     message:@""
                                              preferredStyle:style];

  NSArray<ABI13_0_0RCTDevMenuItem *> *items = [self menuItems];
  for (ABI13_0_0RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [ABI13_0_0RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];
}

- (ABI13_0_0RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(ABI13_0_0RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item) {
      switch (item.type) {
        case ABI13_0_0RCTDevMenuTypeButton: {
          [item callHandler];
          break;
        }

        case ABI13_0_0RCTDevMenuTypeToggle: {
          BOOL value = [self->_settings[item.key] boolValue];
          [self updateSetting:item.key value:@(!value)]; // will call handler
          break;
        }
      }
    }

    self->_actionSheet = nil;
  };
}

ABI13_0_0RCT_EXPORT_METHOD(reload)
{
  [_bridge reload];
}

ABI13_0_0RCT_EXPORT_METHOD(debugRemotely:(BOOL)enableDebug)
{
  Class jsDebuggingExecutorClass = NSClassFromString(@"ABI13_0_0RCTWebSocketExecutor");
  self.executorClass = enableDebug ? jsDebuggingExecutorClass : nil;
}

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _shakeToShow = shakeToShow;
  [self updateSetting:@"shakeToShow" value:@(_shakeToShow)];
}

ABI13_0_0RCT_EXPORT_METHOD(setProfilingEnabled:(BOOL)enabled)
{
  _profilingEnabled = enabled;
  [self updateSetting:@"profilingEnabled" value:@(_profilingEnabled)];

  if (_liveReloadURL && enabled != ABI13_0_0RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling:^(NSData *logData) {
        ABI13_0_0RCTProfileSendResult(self->_bridge, @"systrace", logData);
      }];
    }
  }
}

ABI13_0_0RCT_EXPORT_METHOD(setLiveReloadEnabled:(BOOL)enabled)
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

ABI13_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled:(BOOL)enabled)
{
  _hotLoadingEnabled = enabled;
  [self updateSetting:@"hotLoadingEnabled" value:@(_hotLoadingEnabled)];

  BOOL actuallyEnabled = [self hotLoadingAvailable] && _hotLoadingEnabled;
  if (ABI13_0_0RCTGetURLQueryParam(_bridge.bundleURL, @"hot").boolValue != actuallyEnabled) {
    _bridge.bundleURL = ABI13_0_0RCTURLByReplacingQueryParam(_bridge.bundleURL, @"hot",
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
        _bridge.executorClass != objc_lookUpClass("ABI13_0_0RCTWebSocketExecutor")) {
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

  __weak ABI13_0_0RCTDevMenu *weakSelf = self;
  _updateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:
                 ^(__unused NSData *data, NSURLResponse *response, NSError *error) {

    dispatch_async(dispatch_get_main_queue(), ^{
      ABI13_0_0RCTDevMenu *strongSelf = weakSelf;
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

- (BOOL)isActionSheetShown
{
  return _actionSheet != nil;
}

@end

#else // Unavailable when not in dev mode

@implementation ABI13_0_0RCTDevMenu

- (void)show {}
- (void)reload {}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(ABI13_0_0RCTDevMenu *)item {}
- (BOOL)isActionSheetShown { return NO; }

@end

@implementation ABI13_0_0RCTDevMenuItem

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(void(^)(void))handler {return nil;}
+ (instancetype)toggleItemWithKey:(NSString *)key
                            title:(NSString *)title
                    selectedTitle:(NSString *)selectedTitle
                          handler:(void(^)(BOOL selected))handler {return nil;}
@end

#endif

@implementation  ABI13_0_0RCTBridge (ABI13_0_0RCTDevMenu)

- (ABI13_0_0RCTDevMenu *)devMenu
{
#if ABI13_0_0RCT_DEV
  return [self moduleForClass:[ABI13_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end
