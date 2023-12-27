// Copyright 2018-present 650 Industries. All rights reserved.

#import <JavaScriptCore/JavaScriptCore.h>

#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge+Private.h>
#import <ABI43_0_0React/ABI43_0_0RCTAppState.h>
#import <ABI43_0_0React/ABI43_0_0RCTImageLoader.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXReactNativeAdapter.h>

@interface ABI43_0_0EXReactNativeAdapter ()

@property (nonatomic, weak) ABI43_0_0RCTBridge *bridge;
@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSPointerArray *lifecycleListeners;

@end

@interface ABI43_0_0RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void *)runtime;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation ABI43_0_0EXReactNativeAdapter

ABI43_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return @"ABI43_0_0EXReactNativeAdapter";
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI43_0_0EXAppLifecycleService), @protocol(ABI43_0_0EXUIManager), @protocol(ABI43_0_0EXJavaScriptContextProvider)];
}

# pragma mark - Lifecycle methods

- (instancetype)init
{
  if (self = [super init]) {
    _isForegrounded = false;
    _lifecycleListeners = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  if (moduleRegistry) {
    [self startObserving];
  }
}

- (void)dealloc
{
  [self stopObserving];
}

# pragma mark - Public API

- (void)addUIBlock:(void (^)(NSDictionary<id, UIView *> *))block
{
  __weak ABI43_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI43_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        block(viewRegistry);
      }];
    }
  });
}

- (void)addUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass
{
  [self addUIBlock:^(UIView *view) {
    if (![view isKindOfClass:klass]) {
      block(nil);
    } else {
      block(view);
    }
  } forView:viewId];
}

- (void)addUIBlock:(void (^)(id))block forView:(id)viewId implementingProtocol:(Protocol *)protocol
{
  [self addUIBlock:^(UIView *view) {
    if (![view.class conformsToProtocol:protocol]) {
      block(nil);
    } else {
      block(view);
    }
  } forView:viewId];
}

- (void)dispatchOnClientThread:(dispatch_block_t)block
{
  [self.bridge dispatchBlock:block queue:ABI43_0_0RCTJSThread];
}

- (void)executeUIBlock:(void (^)(NSDictionary<id,UIView *> *))block {
  __weak ABI43_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI43_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        block(viewRegistry);
      }];
      [strongSelf.bridge.uiManager setNeedsLayout];
    }
  });
}


- (void)executeUIBlock:(void (^)(id))block forView:(id)viewId implementingProtocol:(Protocol *)protocol {
  [self executeUIBlock:^(UIView *view) {
    if (![view.class conformsToProtocol:protocol]) {
      block(nil);
    } else {
      block(view);
    }
  } forView:viewId];
}


- (void)executeUIBlock:(void (^)(id))block forView:(id)viewId ofClass:(Class)klass {
  [self executeUIBlock:^(UIView *view) {
    if (![view isKindOfClass:klass]) {
      block(nil);
    } else {
      block(view);
    }
  } forView:viewId];
}


- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)registerAppLifecycleListener:(id<ABI43_0_0EXAppLifecycleListener>)listener
{
  [_lifecycleListeners addPointer:(__bridge void * _Nullable)(listener)];
}

- (void)unregisterAppLifecycleListener:(id<ABI43_0_0EXAppLifecycleListener>)listener
{
  for (int i = 0; i < _lifecycleListeners.count; i++) {
    id pointer = [_lifecycleListeners pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(listener) || !pointer) {
      [_lifecycleListeners removePointerAtIndex:i];
      i--;
    }
  }
  // -(void)compact doesn't work, that's why we have this `|| !pointer` above
  // http://www.openradar.me/15396578
  [_lifecycleListeners compact];
}

# pragma mark - ABI43_0_0EXJavaScriptContextProvider

- (JSGlobalContextRef)javaScriptContextRef
{
  if ([_bridge respondsToSelector:@selector(jsContextRef)]) {
    return _bridge.jsContextRef;
  } else if (_bridge.runtime) {
    // In react-native 0.59 vm is abstracted by JSI and all JSC specific references are removed
    // To access jsc context we are extracting specific offset in jsi::Runtime, JSGlobalContextRef
    // is first field inside Runtime class and in memory it's preceded only by pointer to virtual method table.
    // WARNING: This is temporary solution that may break with new react-native releases.
    return *(((JSGlobalContextRef *)(_bridge.runtime)) + 1);
  }
  return nil;
}

- (void *)javaScriptRuntimePointer
{
  if ([_bridge respondsToSelector:@selector(runtime)]) {
    return _bridge.runtime;
  } else {
    return nil;
  }
}

# pragma mark - App state observing

- (void)startObserving
{
  for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                           UIApplicationDidEnterBackgroundNotification,
                           UIApplicationDidFinishLaunchingNotification,
                           UIApplicationWillResignActiveNotification,
                           UIApplicationWillEnterForegroundNotification,
                           ABI43_0_0RCTContentDidAppearNotification,
                           ABI43_0_0RCTBridgeWillReloadNotification]) {

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:name
                                               object:nil];
  }
}

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  if ([notification.name isEqualToString:ABI43_0_0RCTContentDidAppearNotification]) {
    [self notifyAboutContentDidAppear];
  } else if ([notification.name isEqualToString:ABI43_0_0RCTBridgeWillReloadNotification]) {
    [self notifyAboutContentWillReload];
  } else if (
      _isForegrounded && (
       [notification.name isEqualToString:UIApplicationWillResignActiveNotification] ||
       [notification.name isEqualToString:UIApplicationDidEnterBackgroundNotification] ||
       ABI43_0_0RCTSharedApplication().applicationState == UIApplicationStateBackground
      )
    ) {
    [self setAppStateToBackground];
  } else if (!_isForegrounded && ABI43_0_0RCTSharedApplication().applicationState == UIApplicationStateActive) {
    [self setAppStateToForeground];
  }
}

- (void)setAppStateToBackground
{
  if (_isForegrounded) {
    [[_lifecycleListeners allObjects] enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  }
}

- (void)setAppStateToForeground
{
  if (!_isForegrounded) {
    [[_lifecycleListeners allObjects] enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
      [obj onAppForegrounded];
    }];
    _isForegrounded = true;
  }
}

- (void)notifyAboutContentDidAppear
{
  [[_lifecycleListeners allObjects] enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    if ([obj respondsToSelector:@selector(onAppContentDidAppear)]) {
      [obj performSelector:@selector(onAppContentDidAppear)];
    }
  }];
}

- (void)notifyAboutContentWillReload
{
  [[_lifecycleListeners allObjects] enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    if ([obj respondsToSelector:@selector(onAppContentWillReload)]) {
      [obj performSelector:@selector(onAppContentWillReload)];
    }
  }];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

# pragma mark - Internal methods

- (void)addUIBlock:(void (^)(UIView *view))block forView:(id)viewId
{
  __weak ABI43_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI43_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        block(view);
      }];
    }
  });
}

- (void)executeUIBlock:(void (^)(UIView *view))block forView:(id)viewId
{
  __weak ABI43_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI43_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        block(view);
      }];
      [strongSelf.bridge.uiManager setNeedsLayout];
    }
  });
}

@end
