#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTFabricSurface.h>
#import <ABI49_0_0React/ABI49_0_0RCTRuntimeExecutorFromBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTScheduler.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurface.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenter.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterBridgeAdapter.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceView.h>
#endif

#import <ABI49_0_0RNReanimated/NativeProxy.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0RNReanimated/NewestShadowNodesRegistry.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAInitializerRCTFabricSurface.h>
#import <ABI49_0_0RNReanimated/ReanimatedUIManagerBinding.h>
#endif

#import <ABI49_0_0RNReanimated/ABI49_0_0REAModule.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REANodesManager.h>
#import <ABI49_0_0RNReanimated/ReanimatedVersion.h>
#import <ABI49_0_0RNReanimated/SingleInstanceChecker.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;
using namespace ABI49_0_0reanimated;

@interface ABI49_0_0RCTBridge (JSIRuntime)
- (void *)runtime;
@end

@interface ABI49_0_0RCTBridge (ABI49_0_0RCTTurboModule)
- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker>)jsCallInvoker;
- (void)_tryAndHandleError:(dispatch_block_t)block;
@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
static __strong ABI49_0_0REAInitializerRCTFabricSurface *reaSurface;
#else
typedef void (^AnimatedOperation)(ABI49_0_0REANodesManager *nodesManager);
#endif

@implementation ABI49_0_0REAModule {
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  __weak ABI49_0_0RCTSurfacePresenter *_surfacePresenter;
  std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry;
  std::weak_ptr<NativeReanimatedModule> reanimatedModule_;
#else
  NSMutableArray<AnimatedOperation> *_operations;
#endif
#ifdef DEBUG
  SingleInstanceChecker<ABI49_0_0REAModule> singleInstanceChecker_;
#endif
  bool hasListeners;
}

ABI49_0_0RCT_EXPORT_MODULE(ReanimatedModule);

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)invalidate
{
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
  [_nodesManager invalidate];
  [super invalidate];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return ABI49_0_0RCTGetUIManagerQueue();
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

- (std::shared_ptr<UIManager>)getUIManager
{
  ABI49_0_0RCTScheduler *scheduler = [_surfacePresenter scheduler];
  return scheduler.uiManager;
}

- (void)injectReanimatedUIManagerBinding:(jsi::Runtime &)runtime uiManager:(std::shared_ptr<UIManager>)uiManager
{
  RuntimeExecutor syncRuntimeExecutor = [&](std::function<void(jsi::Runtime & runtime_)> &&callback) {
    callback(runtime);
  };
  ReanimatedUIManagerBinding::createAndInstallIfNeeded(
      runtime, syncRuntimeExecutor, uiManager, newestShadowNodesRegistry);
}

- (void)setUpNativeReanimatedModule:(std::shared_ptr<UIManager>)uiManager
{
  if (auto reanimatedModule = reanimatedModule_.lock()) {
    reanimatedModule->setUIManager(uiManager);
    reanimatedModule->setNewestShadowNodesRegistry(newestShadowNodesRegistry);
  }
}

- (void)injectDependencies:(jsi::Runtime &)runtime
{
  auto uiManager = [self getUIManager];
  react_native_assert(uiManager.get() != nil);
  newestShadowNodesRegistry = std::make_shared<NewestShadowNodesRegistry>();
  [self injectReanimatedUIManagerBinding:runtime uiManager:uiManager];
  [self setUpNativeReanimatedModule:uiManager];
}

#pragma mark-- Initialize

- (void)installReanimatedUIManagerBindingAfterReload
{
  // called from ABI49_0_0REAInitializerRCTFabricSurface::start
  __weak __typeof__(self) weakSelf = self;
  _surfacePresenter = self.bridge.surfacePresenter;
  [_nodesManager setSurfacePresenter:_surfacePresenter];

  // to avoid deadlock we can't use Executor from ABI49_0_0React Native
  // but we can create own and use it because initialization is already synchronized
  react_native_assert(self.bridge != nil);
  ABI49_0_0RCTRuntimeExecutorFromBridge(self.bridge)(^(jsi::Runtime &runtime) {
    if (__typeof__(self) strongSelf = weakSelf) {
      [strongSelf injectDependencies:runtime];
    }
  });
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  _surfacePresenter = self.bridge.surfacePresenter;
  ABI49_0_0RCTScheduler *scheduler = [_surfacePresenter scheduler];
  __weak __typeof__(self) weakSelf = self;
  _surfacePresenter.runtimeExecutor(^(jsi::Runtime &runtime) {
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    if (auto reanimatedModule = strongSelf->reanimatedModule_.lock()) {
      auto eventListener =
          std::make_shared<ABI49_0_0facebook::ABI49_0_0React::EventListener>([reanimatedModule](const RawEvent &rawEvent) {
            if (!ABI49_0_0RCTIsMainQueue()) {
              // event listener called on the JS thread, let's ignore this event
              // as we cannot safely access worklet runtime here
              // and also we don't care about topLayout events
              return false;
            }
            return reanimatedModule->handleRawEvent(rawEvent, CACurrentMediaTime() * 1000);
          });
      [scheduler addEventListener:eventListener];
    }
  });
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleJavaScriptDidLoadNotification:)
                                               name:ABI49_0_0RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
  [bridge.uiManager.observerCoordinator addObserver:self];

  // only within the first loading `self.bridge.surfacePresenter` exists
  // during the reload `self.bridge.surfacePresenter` is null
  _surfacePresenter = self.bridge.surfacePresenter;
#ifdef DEBUG
  if (reaSurface == nil) {
    // we need only one instance because SurfacePresenter is the same during the application lifetime
    reaSurface = [[ABI49_0_0REAInitializerRCTFabricSurface alloc] init];
    [_surfacePresenter registerSurface:reaSurface];
  }
  reaSurface.reaModule = self;
#endif

  if (_surfacePresenter == nil) {
    // _surfacePresenter will be set in installReanimatedUIManagerBindingAfterReload
    _nodesManager = [[ABI49_0_0REANodesManager alloc] initWithModule:self bridge:self.bridge surfacePresenter:nil];
    return;
  }

  _nodesManager = [[ABI49_0_0REANodesManager alloc] initWithModule:self bridge:self.bridge surfacePresenter:_surfacePresenter];
}

#else

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _nodesManager = [[ABI49_0_0REANodesManager alloc] initWithModule:self uiManager:self.bridge.uiManager];
  _operations = [NSMutableArray new];

  [bridge.uiManager.observerCoordinator addObserver:self];
}

#pragma mark-- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

#pragma mark - ABI49_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI49_0_0RCTUIManager *)uiManager
{
  [_nodesManager maybeFlushUpdateBuffer];
  if (_operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *operations = _operations;
  _operations = [NSMutableArray new];

  ABI49_0_0REANodesManager *nodesManager = _nodesManager;

  [uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(nodesManager);
    }
    [nodesManager operationsBatchDidComplete];
  }];
}

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onReanimatedCall", @"onReanimatedPropsChange" ];
}

- (void)eventDispatcherWillDispatchEvent:(id<ABI49_0_0RCTEvent>)event
{
  // Events can be dispatched from any queue
  [_nodesManager dispatchEvent:event];
}

- (void)startObserving
{
  hasListeners = YES;
}

- (void)stopObserving
{
  hasListeners = NO;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  if (hasListeners) {
    [super sendEventWithName:eventName body:body];
  }
}

ABI49_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installTurboModule)
{
  ABI49_0_0facebook::jsi::Runtime *jsiRuntime = [self.bridge respondsToSelector:@selector(runtime)]
      ? reinterpret_cast<ABI49_0_0facebook::jsi::Runtime *>(self.bridge.runtime)
      : nullptr;

  if (jsiRuntime) {
    jsi::Runtime &runtime = *jsiRuntime;

    auto reanimatedModule = ABI49_0_0reanimated::createReanimatedModule(self.bridge, self.bridge.jsCallInvoker);

    auto workletRuntimeValue = runtime.global()
                                   .getProperty(runtime, "ArrayBuffer")
                                   .asObject(runtime)
                                   .asFunction(runtime)
                                   .callAsConstructor(runtime, {static_cast<double>(sizeof(void *))});
    uintptr_t *workletRuntimeData =
        reinterpret_cast<uintptr_t *>(workletRuntimeValue.getObject(runtime).getArrayBuffer(runtime).data(runtime));
    workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedModule->runtime.get());

    runtime.global().setProperty(runtime, "_WORKLET_RUNTIME", workletRuntimeValue);

    runtime.global().setProperty(runtime, "_WORKLET", false);

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    runtime.global().setProperty(runtime, "_IS_FABRIC", true);
#else
    runtime.global().setProperty(runtime, "_IS_FABRIC", false);
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

    auto version = getReanimatedVersionString(runtime);
    runtime.global().setProperty(runtime, "_REANIMATED_VERSION_CPP", version);

    runtime.global().setProperty(
        runtime,
        jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
        jsi::Object::createFromHostObject(runtime, reanimatedModule));

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    reanimatedModule_ = reanimatedModule;
    if (_surfacePresenter != nil) {
      // reload, uiManager is null right now, we need to wait for `installReanimatedUIManagerBindingAfterReload`
      [self injectDependencies:runtime];
    }
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
  }

  return nil;
}

@end
