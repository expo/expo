// Copyright 2018-present 650 Industries. All rights reserved.

#import <JavaScriptCore/JavaScriptCore.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXReactNativeAdapter.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTAppState.h>
#import <ReactABI30_0_0/ABI30_0_0RCTImageLoader.h>

@interface ABI30_0_0EXReactNativeAdapter ()

@property (nonatomic, weak) ABI30_0_0RCTBridge *bridge;
@property (nonatomic, weak) ABI30_0_0EXNativeModulesProxy *modulesProxy;
@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSMutableSet<id<ABI30_0_0EXAppLifecycleListener>> *lifecycleListeners;

@end

@interface ABI30_0_0RCTBridge ()

- (JSGlobalContextRef)jsContextRef;
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

@end

@implementation ABI30_0_0EXReactNativeAdapter

ABI30_0_0EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return nil;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI30_0_0EXAppLifecycleService), @protocol(ABI30_0_0EXUIManager), @protocol(ABI30_0_0EXJavaScriptContextProvider), @protocol(ABI30_0_0EXImageLoaderInterface)];
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
  [self.bridge dispatchBlock:block queue:ABI30_0_0RCTJSThread];
}

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (void)registerAppLifecycleListener:(id<ABI30_0_0EXAppLifecycleListener>)listener
{
  [_lifecycleListeners addObject:listener];
}

- (void)unregisterAppLifecycleListener:(id<ABI30_0_0EXAppLifecycleListener>)listener
{
  [_lifecycleListeners removeObject:listener];
}

# pragma mark - ABI30_0_0EXJavaScriptContextProvider

- (JSGlobalContextRef)javaScriptContextRef
{
  return _bridge.jsContextRef;
}

# pragma mark - ABI30_0_0EXImageLoader

- (void)loadImageForURL:(NSURL *)imageURL
      completionHandler:(ABI30_0_0EXImageLoaderCompletionBlock)completionHandler
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
       ABI30_0_0RCTSharedApplication().applicationState == UIApplicationStateBackground
      )
    ) {
    [self setAppStateToBackground];
  } else if (!_isForegrounded && ABI30_0_0RCTSharedApplication().applicationState == UIApplicationStateActive) {
    [self setAppStateToForeground];
  }
}

- (void)setAppStateToBackground
{
  if (_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<ABI30_0_0EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  }
}

- (void)setAppStateToForeground
{
  if (!_isForegrounded) {
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<ABI30_0_0EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
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
  __weak ABI30_0_0EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong ABI30_0_0EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        block(view);
      }];
    }
  });
}

@end

extern void ABI30_0_0EXLogInfo(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI30_0_0RCTLogInfo(@"%@", message);
}

extern void ABI30_0_0EXLogWarn(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI30_0_0RCTLogWarn(@"%@", message);
}

extern void ABI30_0_0EXLogError(NSString *format, ...) {
  va_list args;
  va_start(args, format);
  NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  ABI30_0_0RCTLogError(@"%@", message);
}

extern void ABI30_0_0EXFatal(NSError *error) {
  ABI30_0_0RCTFatal(error);
}

extern NSError * ABI30_0_0EXErrorWithMessage(NSString *message) {
  return ABI30_0_0RCTErrorWithMessage(message);
}

extern UIApplication *ABI30_0_0EXSharedApplication() {
  return ABI30_0_0RCTSharedApplication();
}
