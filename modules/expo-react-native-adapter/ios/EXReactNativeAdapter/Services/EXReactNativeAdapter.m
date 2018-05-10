// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXReactNativeAdapter.h>
#import <React/RCTUIManager.h>
#import <React/RCTAppState.h>

@interface EXReactNativeAdapter ()

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, weak) EXNativeModulesProxy *modulesProxy;
@property (nonatomic, assign) BOOL isForegrounded;
@property (nonatomic, strong) NSMutableSet<id<EXAppLifecycleListener>> *lifecycleListeners;

@end

@implementation EXReactNativeAdapter

EX_REGISTER_MODULE();

+ (NSString *)moduleName
{
  return nil;
}

+ (const NSArray<NSString *> *)internalModuleNames
{
  return @[@"LifecycleManager", @"UIManager"];
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
  __weak EXReactNativeAdapter *weakSelf = self;
  dispatch_async(_bridge.uiManager.methodQueue, ^{
    __strong EXReactNativeAdapter *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[viewId];
        if (![view isKindOfClass:klass]) {
          block(nil);
        } else {
          block(view);
        }
      }];
    }
  });
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
    [_lifecycleListeners enumerateObjectsUsingBlock:^(id<EXAppLifecycleListener>  _Nonnull obj, BOOL * _Nonnull stop) {
      [obj onAppBackgrounded];
    }];
    _isForegrounded = false;
  } else if (!_isForegrounded && RCTSharedApplication().applicationState == UIApplicationStateActive) {
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
