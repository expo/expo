// Copyright 2018-present 650 Industries. All rights reserved.

#import <JavaScriptCore/JavaScriptCore.h>
#import <EXReactNativeAdapter/EXReactNativeAdapter.h>
#import <React/RCTUIManager.h>
#import <React/RCTAppState.h>
#import <React/RCTImageLoader.h>

@interface EXReactNativeAdapter ()

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, weak) EXNativeModulesProxy *modulesProxy;
@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSMutableSet<id<EXAppLifecycleListener>> *lifecycleListeners;

@end

@interface RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation EXReactNativeAdapter

EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return nil;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXAppLifecycleService), @protocol(EXUIManager), @protocol(EXJavaScriptContextProvider), @protocol(EXImageLoaderInterface)];
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
  [self.bridge dispatchBlock:block queue:RCTJSThread];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)registerAppLifecycleListener:(id<EXAppLifecycleListener>)listener
{
  [_lifecycleListeners addObject:listener];
}

- (void)unregisterAppLifecycleListener:(id<EXAppLifecycleListener>)listener
{
  [_lifecycleListeners removeObject:listener];
}

# pragma mark - EXJavaScriptContextProvider

- (JSGlobalContextRef)javaScriptContextRef
{
  return _bridge.jsContextRef;
}

# pragma mark - EXImageLoader

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(EXImageLoaderCompletionBlock)completionHandler
{
   [_bridge.imageLoader loadImageWithURLRequest:[NSURLRequest requestWithURL:imageURL]
                                       callback:^(NSError *error, UIImage *loadedImage) {
                                         completionHandler(error, loadedImage);
                                       }];
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
       RCTSharedApplication().applicationState == UIApplicationStateBackground
      )
    ) {
    [self setAppStateToBackground];
  } else if (!_isForegrounded && RCTSharedApplication().applicationState == UIApplicationStateActive) {
    [self setAppStateToForeground];
  }
}

- (void)setAppStateToBackground
{
  if (_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  }
}

- (void)setAppStateToForeground
{
  if (!_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
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
  __weak EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        block(view);
      }];
    }
  });
}

@end

extern void EXLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  RCTLogInfo(@"%@", message);
}

extern void EXLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  RCTLogWarn(@"%@", message);
}

extern void EXLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  RCTLogError(@"%@", message);
}

extern void EXFatal(NSError *error) {
  RCTFatal(error);
}

extern NSError * EXErrorWithMessage(NSString *message) {
  return RCTErrorWithMessage(message);
}

extern UIApplication *EXSharedApplication() {
  return RCTSharedApplication();
}
