/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSurfacePresenter.h"

#import <mutex>

#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge+Private.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponentViewFactory.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponentViewRegistry.h>
#import <ABI45_0_0React/ABI45_0_0RCTConstants.h>
#import <ABI45_0_0React/ABI45_0_0RCTFabricSurface.h>
#import <ABI45_0_0React/ABI45_0_0RCTFollyConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTI18nUtil.h>
#import <ABI45_0_0React/ABI45_0_0RCTMountingManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTMountingManagerDelegate.h>
#import <ABI45_0_0React/ABI45_0_0RCTScheduler.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfaceRegistry.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfaceView+Internal.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfaceView.h>
#import <ABI45_0_0React/ABI45_0_0RCTUtils.h>

#import <ABI45_0_0React/ABI45_0_0config/ABI45_0_0ReactNativeConfig.h>
#import <ABI45_0_0React/ABI45_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI45_0_0React/ABI45_0_0renderer/runtimescheduler/RuntimeScheduler.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/AsynchronousEventBeat.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/SynchronousEventBeat.h>
#import <ABI45_0_0React/ABI45_0_0utils/ContextContainer.h>
#import <ABI45_0_0React/ABI45_0_0utils/ManagedObjectWrapper.h>

#import "ABI45_0_0PlatformRunLoopObserver.h"
#import "ABI45_0_0RCTConversions.h"

using namespace ABI45_0_0facebook::ABI45_0_0React;

static dispatch_queue_t ABI45_0_0RCTGetBackgroundQueue()
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_attr_t attr =
        dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
    queue = dispatch_queue_create("com.facebook.ABI45_0_0React.background", attr);
  });
  return queue;
}

static BackgroundExecutor ABI45_0_0RCTGetBackgroundExecutor()
{
  return [](std::function<void()> &&callback) {
    if (ABI45_0_0RCTIsMainQueue()) {
      callback();
      return;
    }

    auto copyableCallback = callback;
    dispatch_async(ABI45_0_0RCTGetBackgroundQueue(), ^{
      copyableCallback();
    });
  };
}

@interface ABI45_0_0RCTSurfacePresenter () <ABI45_0_0RCTSchedulerDelegate, ABI45_0_0RCTMountingManagerDelegate>
@end

@implementation ABI45_0_0RCTSurfacePresenter {
  ABI45_0_0RCTMountingManager *_mountingManager; // Thread-safe.
  ABI45_0_0RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.

  std::mutex _schedulerAccessMutex;
  std::mutex _schedulerLifeCycleMutex;
  ABI45_0_0RCTScheduler *_Nullable _scheduler; // Thread-safe. Pointer is protected by `_schedulerAccessMutex`.
  ContextContainer::Shared _contextContainer; // Protected by `_schedulerLifeCycleMutex`.
  RuntimeExecutor _runtimeExecutor; // Protected by `_schedulerLifeCycleMutex`.

  butter::shared_mutex _observerListMutex;
  NSMutableArray<id<ABI45_0_0RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithContextContainer:(ContextContainer::Shared)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");
    _runtimeExecutor = runtimeExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [ABI45_0_0RCTSurfaceRegistry new];
    _mountingManager = [ABI45_0_0RCTMountingManager new];
    _mountingManager.contextContainer = contextContainer;
    _mountingManager.delegate = self;

    _observers = [NSMutableArray array];

    _scheduler = [self _createScheduler];
  }

  return self;
}

- (ABI45_0_0RCTMountingManager *)mountingManager
{
  return _mountingManager;
}

- (ABI45_0_0RCTScheduler *_Nullable)_scheduler
{
  std::lock_guard<std::mutex> lock(_schedulerAccessMutex);
  return _scheduler;
}

- (ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  return _contextContainer;
}

- (void)setContextContainer:(ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  _contextContainer = contextContainer;
  _mountingManager.contextContainer = contextContainer;
}

- (RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  return _runtimeExecutor;
}

- (void)setRuntimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  _runtimeExecutor = runtimeExecutor;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(ABI45_0_0RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  ABI45_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [scheduler registerSurface:surface.surfaceHandler];
  }
}

- (void)unregisterSurface:(ABI45_0_0RCTFabricSurface *)surface
{
  ABI45_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [scheduler unregisterSurface:surface.surfaceHandler];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (ABI45_0_0RCTFabricSurface *)surfaceForRootTag:(ABI45_0_0ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag
{
  UIView<ABI45_0_0RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  return componentView;
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI45_0_0ReactTag props:(NSDictionary *)props
{
  ABI45_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return NO;
  }

  ABI45_0_0ReactTag tag = [ABI45_0_0ReactTag integerValue];
  UIView<ABI45_0_0RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  if (componentView == nil) {
    return NO; // This view probably isn't managed by Fabric
  }
  ComponentHandle handle = [[componentView class] componentDescriptorProvider].handle;
  auto *componentDescriptor = [scheduler findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:handle];

  if (!componentDescriptor) {
    return YES;
  }

  [_mountingManager synchronouslyUpdateViewOnUIThread:tag changedProps:props componentDescriptor:*componentDescriptor];
  return YES;
}

- (void)setupAnimationDriverWithSurfaceHandler:(ABI45_0_0facebook::ABI45_0_0React::SurfaceHandler const &)surfaceHandler
{
  [[self _scheduler] setupAnimationDriver:surfaceHandler];
}

- (BOOL)suspend
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);

  ABI45_0_0RCTScheduler *scheduler;
  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);

    if (!_scheduler) {
      return NO;
    }
    scheduler = _scheduler;
    _scheduler = nil;
  }

  [self _stopAllSurfacesWithScheduler:scheduler];

  return YES;
}

- (BOOL)resume
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);

  ABI45_0_0RCTScheduler *scheduler;
  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);

    if (_scheduler) {
      return NO;
    }
    scheduler = [self _createScheduler];
  }

  [self _startAllSurfacesWithScheduler:scheduler];

  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);
    _scheduler = scheduler;
  }

  return YES;
}

#pragma mark - Private

- (ABI45_0_0RCTScheduler *)_createScheduler
{
  auto ABI45_0_0ReactNativeConfig = _contextContainer->at<std::shared_ptr<ABI45_0_0ReactNativeConfig const>>("ABI45_0_0ReactNativeConfig");

  if (ABI45_0_0ReactNativeConfig && ABI45_0_0ReactNativeConfig->getBool("ABI45_0_0React_fabric:preemptive_view_allocation_disabled_ios")) {
    ABI45_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(YES);
  }

  auto componentRegistryFactory =
      [factory = wrapManagedObject(_mountingManager.componentViewRegistry.componentViewFactory)](
          EventDispatcher::Weak const &eventDispatcher, ContextContainer::Shared const &contextContainer) {
        return [(ABI45_0_0RCTComponentViewFactory *)unwrapManagedObject(factory)
            createComponentDescriptorRegistryWithParameters:{eventDispatcher, contextContainer}];
      };

  auto runtimeExecutor = _runtimeExecutor;

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = _contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;

  auto weakRuntimeScheduler = _contextContainer->find<std::weak_ptr<RuntimeScheduler>>("RuntimeScheduler");
  auto runtimeScheduler = weakRuntimeScheduler.hasValue() ? weakRuntimeScheduler.value().lock() : nullptr;
  if (runtimeScheduler) {
    runtimeExecutor = [runtimeScheduler](std::function<void(jsi::Runtime & runtime)> &&callback) {
      runtimeScheduler->scheduleWork(std::move(callback));
    };
  }

  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.mainRunLoopObserverFactory = [](RunLoopObserver::Activity activities,
                                          RunLoopObserver::WeakOwner const &owner) {
    return std::make_unique<MainRunLoopObserver>(activities, owner);
  };

  toolbox.backgroundExecutor = ABI45_0_0RCTGetBackgroundExecutor();

  toolbox.synchronousEventBeatFactory =
      [runtimeExecutor, runtimeScheduler = runtimeScheduler](EventBeat::SharedOwnerBox const &ownerBox) {
        auto runLoopObserver =
            std::make_unique<MainRunLoopObserver const>(RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
        return std::make_unique<SynchronousEventBeat>(std::move(runLoopObserver), runtimeExecutor, runtimeScheduler);
      };

  toolbox.asynchronousEventBeatFactory =
      [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) -> std::unique_ptr<EventBeat> {
    auto runLoopObserver =
        std::make_unique<MainRunLoopObserver const>(RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
    return std::make_unique<AsynchronousEventBeat>(std::move(runLoopObserver), runtimeExecutor);
  };

  ABI45_0_0RCTScheduler *scheduler = [[ABI45_0_0RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
}

- (void)_startAllSurfacesWithScheduler:(ABI45_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI45_0_0RCTFabricSurface *> *enumerator) {
    for (ABI45_0_0RCTFabricSurface *surface in enumerator) {
      [scheduler registerSurface:surface.surfaceHandler];
      [surface start];
    }
  }];
}

- (void)_stopAllSurfacesWithScheduler:(ABI45_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI45_0_0RCTFabricSurface *> *enumerator) {
    for (ABI45_0_0RCTFabricSurface *surface in enumerator) {
      [surface stop];
      [scheduler unregisterSurface:surface.surfaceHandler];
    }
  }];
}

#pragma mark - ABI45_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args
{
  ABI45_0_0ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)schedulerDidSendAccessibilityEvent:(const ABI45_0_0facebook::ABI45_0_0React::ShadowView &)shadowView
                                 eventType:(const std::string &)eventType
{
  ABI45_0_0ReactTag tag = shadowView.tag;
  NSString *eventTypeStr = [[NSString alloc] initWithUTF8String:eventType.c_str()];

  [self->_mountingManager sendAccessibilityEvent:tag eventType:eventTypeStr];
}

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(ABI45_0_0facebook::ABI45_0_0React::ShadowView const &)shadowView;
{
  [self->_mountingManager setIsJSResponder:isJSResponder
                      blockNativeResponder:blockNativeResponder
                             forShadowView:shadowView];
}

- (void)addObserver:(id<ABI45_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<butter::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI45_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<butter::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI45_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI45_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ABI45_0_0ReactTag)rootTag
{
  ABI45_0_0RCTAssertMainQueue();

  std::shared_lock<butter::shared_mutex> lock(_observerListMutex);
  for (id<ABI45_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(ABI45_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ABI45_0_0ReactTag)rootTag
{
  ABI45_0_0RCTAssertMainQueue();

  std::shared_lock<butter::shared_mutex> lock(_observerListMutex);
  for (id<ABI45_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }
}

@end
