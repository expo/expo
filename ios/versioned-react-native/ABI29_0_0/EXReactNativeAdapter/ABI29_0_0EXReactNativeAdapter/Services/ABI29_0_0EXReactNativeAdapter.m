// Copyright 2018-present 650 Industries. All rights reserved.

#import <JavaScriptCore/JavaScriptCore.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXReactNativeAdapter.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ReactABI29_0_0/ABI29_0_0RCTAppState.h>

@interface ABI29_0_0EXReactNativeAdapter ()

@property (nonatomic, weak) ABI29_0_0RCTBridge *bridge;
@property (nonatomic, weak) ABI29_0_0EXNativeModulesProxy *modulesProxy;
@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSMutableSet<id<ABI29_0_0EXAppLifecycleListener>> *lifecycleListeners;

@end

@interface ABI29_0_0RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation ABI29_0_0EXReactNativeAdapter

ABI29_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return nil;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI29_0_0EXAppLifecycleService), @protocol(ABI29_0_0EXUIManager), @protocol(ABI29_0_0EXJavaScriptContextProvider)];
}

# pragma mark - Lifecycle methods

- (instancetype)init
{
  if (self = [super init]) {
    _isForegrounded = false;
    [self startObserving];
    _lifecycleListeners = [NSMutableSet set];
  }
  return self;
}

- (void)dealloc
{
  [self stopObserving];
}

# pragma mark - Public API

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
  [self.bridge dispatchBlock:block queue:ABI29_0_0RCTJSThread];
}

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)registerAppLifecycleListener:(id<ABI29_0_0EXAppLifecycleListener>)listener
{
  [_lifecycleListeners addObject:listener];
}

- (void)unregisterAppLifecycleListener:(id<ABI29_0_0EXAppLifecycleListener>)listener
{
  [_lifecycleListeners removeObject:listener];
}

# pragma mark - ABI29_0_0EXJavaScriptContextProvider

- (JSGlobalContextRef)javaScriptContextRef
{
  return _bridge.jsContextRef;
}

# pragma mark - App state observing

- (void)startObserving
{
  for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                           UIApplicationDidEnterBackgroundNotification,
                           UIApplicationDidFinishLaunchingNotification,
                           UIApplicationWillResignActiveNotification,
                           UIApplicationWillEnterForegroundNotification]) {
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:name
                                               object:nil];
  }
}

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  if (
      _isForegrounded && (
       [notification.name isEqualToString:UIApplicationWillResignActiveNotification] ||
       [notification.name isEqualToString:UIApplicationWillEnterForegroundNotification] ||
       ABI29_0_0RCTSharedApplication().applicationState == UIApplicationStateBackground
      )
    ) {
    [self setAppStateToBackground];
  } else if (!_isForegrounded && ABI29_0_0RCTSharedApplication().applicationState == UIApplicationStateActive) {
    [self setAppStateToForeground];
  }
}

- (void)setAppStateToBackground
{
  if (_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<ABI29_0_0EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  }
}

- (void)setAppStateToForeground
{
  if (!_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<ABI29_0_0EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppForegrounded];
    }];
    _isForegrounded = true;
  }
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

# pragma mark - Internal methods

- (void)addUIBlock:(void (^)(UIView *view))block forView:(id)viewId
{
  __weak ABI29_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI29_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        block(view);
      }];
    }
  });
}

@end

extern void ABI29_0_0EXLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI29_0_0RCTLogInfo(@"%@", message);
}

extern void ABI29_0_0EXLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI29_0_0RCTLogWarn(@"%@", message);
}

extern void ABI29_0_0EXLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI29_0_0RCTLogError(@"%@", message);
}

extern void ABI29_0_0EXFatal(NSError *error) {
  ABI29_0_0RCTFatal(error);
}

extern NSError * ABI29_0_0EXErrorWithMessage(NSString *message) {
  return ABI29_0_0RCTErrorWithMessage(message);
}

extern UIApplication *ABI29_0_0EXSharedApplication() {
  return ABI29_0_0RCTSharedApplication();
}
