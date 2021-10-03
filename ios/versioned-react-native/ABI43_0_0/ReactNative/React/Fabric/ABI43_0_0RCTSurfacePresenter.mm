/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTSurfacePresenter.h"

#import <mutex>

#import <ABI43_0_0React/ABI43_0_0RCTAssert.h>
#import <ABI43_0_0React/ABI43_0_0RCTComponentViewFactory.h>
#import <ABI43_0_0React/ABI43_0_0RCTComponentViewRegistry.h>
#import <ABI43_0_0React/ABI43_0_0RCTConstants.h>
#import <ABI43_0_0React/ABI43_0_0RCTFabricSurface.h>
#import <ABI43_0_0React/ABI43_0_0RCTFollyConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTI18nUtil.h>
#import <ABI43_0_0React/ABI43_0_0RCTMountingManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTMountingManagerDelegate.h>
#import <ABI43_0_0React/ABI43_0_0RCTScheduler.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceRegistry.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceView+Internal.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceView.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import <ABI43_0_0React/ABI43_0_0config/ABI43_0_0ReactNativeConfig.h>
#import <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/root/RootShadowNode.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/LayoutContext.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/AsynchronousEventBeat.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/SynchronousEventBeat.h>
#import <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>
#import <ABI43_0_0React/ABI43_0_0utils/ManagedObjectWrapper.h>

#import "ABI43_0_0PlatformRunLoopObserver.h"
#import "ABI43_0_0RCTConversions.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

static inline LayoutConstraints ABI43_0_0RCTGetLayoutConstraintsForSize(CGSize minimumSize, CGSize maximumSize)
{
  return {
      .minimumSize = ABI43_0_0RCTSizeFromCGSize(minimumSize),
      .maximumSize = ABI43_0_0RCTSizeFromCGSize(maximumSize),
      .layoutDirection = ABI43_0_0RCTLayoutDirection([[ABI43_0_0RCTI18nUtil sharedInstance] isRTL]),
  };
}

static inline LayoutContext ABI43_0_0RCTGetLayoutContext(CGPoint viewportOffset)
{
  return {.pointScaleFactor = ABI43_0_0RCTScreenScale(),
          .swapLeftAndRightInRTL =
              [[ABI43_0_0RCTI18nUtil sharedInstance] isRTL] && [[ABI43_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL],
          .fontSizeMultiplier = ABI43_0_0RCTFontSizeMultiplier(),
          .viewportOffset = ABI43_0_0RCTPointFromCGPoint(viewportOffset)};
}

static dispatch_queue_t ABI43_0_0RCTGetBackgroundQueue()
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_attr_t attr =
        dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
    queue = dispatch_queue_create("com.facebook.ABI43_0_0React.background", attr);
  });
  return queue;
}

static BackgroundExecutor ABI43_0_0RCTGetBackgroundExecutor()
{
  return [](std::function<void()> &&callback) {
    if (ABI43_0_0RCTIsMainQueue()) {
      callback();
      return;
    }

    auto copyableCallback = callback;
    dispatch_async(ABI43_0_0RCTGetBackgroundQueue(), ^{
      copyableCallback();
    });
  };
}

@interface ABI43_0_0RCTSurfacePresenter () <ABI43_0_0RCTSchedulerDelegate, ABI43_0_0RCTMountingManagerDelegate>
@end

@implementation ABI43_0_0RCTSurfacePresenter {
  ABI43_0_0RCTMountingManager *_mountingManager; // Thread-safe.
  ABI43_0_0RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.

  std::mutex _schedulerAccessMutex;
  std::mutex _schedulerLifeCycleMutex;
  ABI43_0_0RCTScheduler *_Nullable _scheduler; // Thread-safe. Pointer is protected by `_schedulerAccessMutex`.
  ContextContainer::Shared _contextContainer; // Protected by `_schedulerLifeCycleMutex`.
  RuntimeExecutor _runtimeExecutor; // Protected by `_schedulerLifeCycleMutex`.

  better::shared_mutex _observerListMutex;
  NSMutableArray<id<ABI43_0_0RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithContextContainer:(ContextContainer::Shared)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");

    _runtimeExecutor = runtimeExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [[ABI43_0_0RCTSurfaceRegistry alloc] init];
    _mountingManager = [[ABI43_0_0RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    _observers = [NSMutableArray array];

    _scheduler = [self _createScheduler];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleContentSizeCategoryDidChangeNotification:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
  }

  return self;
}

- (ABI43_0_0RCTScheduler *_Nullable)_scheduler
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

- (void)registerSurface:(ABI43_0_0RCTFabricSurface *)surface
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  [_surfaceRegistry registerSurface:surface];
  if (scheduler) {
    [self _startSurface:surface scheduler:scheduler];
  }
}

- (void)unregisterSurface:(ABI43_0_0RCTFabricSurface *)surface
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [self _stopSurface:surface scheduler:scheduler];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props surface:(ABI43_0_0RCTFabricSurface *)surface
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [self _stopSurface:surface scheduler:scheduler];
    [self _startSurface:surface scheduler:scheduler];
  }
}

- (ABI43_0_0RCTFabricSurface *)surfaceForRootTag:(ABI43_0_0ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI43_0_0RCTFabricSurface *)surface
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return minimumSize;
  }
  LayoutContext layoutContext = ABI43_0_0RCTGetLayoutContext(surface.viewportOffset);
  LayoutConstraints layoutConstraints = ABI43_0_0RCTGetLayoutConstraintsForSize(minimumSize, maximumSize);
  return [scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                          layoutContext:layoutContext
                                              surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI43_0_0RCTFabricSurface *)surface
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return;
  }

  LayoutContext layoutContext = ABI43_0_0RCTGetLayoutContext(surface.viewportOffset);
  LayoutConstraints layoutConstraints = ABI43_0_0RCTGetLayoutConstraintsForSize(minimumSize, maximumSize);
  [scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                            layoutContext:layoutContext
                                                surfaceId:surface.rootTag];
}

- (UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag
{
  UIView<ABI43_0_0RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  return componentView;
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI43_0_0ReactTag props:(NSDictionary *)props
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return NO;
  }

  ABI43_0_0ReactTag tag = [ABI43_0_0ReactTag integerValue];
  UIView<ABI43_0_0RCTComponentViewProtocol> *componentView =
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

- (BOOL)synchronouslyWaitSurface:(ABI43_0_0RCTFabricSurface *)surface timeout:(NSTimeInterval)timeout
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return NO;
  }

  auto mountingCoordinator = [scheduler mountingCoordinatorWithSurfaceId:surface.rootTag];

  if (!mountingCoordinator->waitForTransaction(std::chrono::duration<NSTimeInterval>(timeout))) {
    return NO;
  }

  [_mountingManager scheduleTransaction:mountingCoordinator];

  return YES;
}

- (BOOL)suspend
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);

  ABI43_0_0RCTScheduler *scheduler;
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

  ABI43_0_0RCTScheduler *scheduler;
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

- (ABI43_0_0RCTScheduler *)_createScheduler
{
  auto ABI43_0_0ReactNativeConfig = _contextContainer->at<std::shared_ptr<ABI43_0_0ReactNativeConfig const>>("ABI43_0_0ReactNativeConfig");

  if (ABI43_0_0ReactNativeConfig && ABI43_0_0ReactNativeConfig->getBool("ABI43_0_0React_fabric:scrollview_on_demand_mounting_ios")) {
    ABI43_0_0RCTExperimentSetOnDemandViewMounting(YES);
  }

  if (ABI43_0_0ReactNativeConfig && ABI43_0_0ReactNativeConfig->getBool("ABI43_0_0React_fabric:optimized_hit_testing_ios")) {
    ABI43_0_0RCTExperimentSetOptimizedHitTesting(YES);
  }

  if (ABI43_0_0ReactNativeConfig && ABI43_0_0ReactNativeConfig->getBool("ABI43_0_0React_fabric:preemptive_view_allocation_disabled_ios")) {
    ABI43_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(YES);
  }

  auto componentRegistryFactory =
      [factory = wrapManagedObject(_mountingManager.componentViewRegistry.componentViewFactory)](
          EventDispatcher::Weak const &eventDispatcher, ContextContainer::Shared const &contextContainer) {
        return [(ABI43_0_0RCTComponentViewFactory *)unwrapManagedObject(factory)
            createComponentDescriptorRegistryWithParameters:{eventDispatcher, contextContainer}];
      };

  auto runtimeExecutor = _runtimeExecutor;

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = _contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;
  toolbox.runtimeExecutor = runtimeExecutor;
  toolbox.mainRunLoopObserverFactory = [](RunLoopObserver::Activity activities,
                                          RunLoopObserver::WeakOwner const &owner) {
    return std::make_unique<MainRunLoopObserver>(activities, owner);
  };

  if (ABI43_0_0ReactNativeConfig && ABI43_0_0ReactNativeConfig->getBool("ABI43_0_0React_fabric:enable_background_executor_ios")) {
    toolbox.backgroundExecutor = ABI43_0_0RCTGetBackgroundExecutor();
  }

  toolbox.synchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    auto runLoopObserver =
        std::make_unique<MainRunLoopObserver const>(RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
    return std::make_unique<SynchronousEventBeat>(std::move(runLoopObserver), runtimeExecutor);
  };

  toolbox.asynchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    auto runLoopObserver =
        std::make_unique<MainRunLoopObserver const>(RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
    return std::make_unique<AsynchronousEventBeat>(std::move(runLoopObserver), runtimeExecutor);
  };

  ABI43_0_0RCTScheduler *scheduler = [[ABI43_0_0RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
}

- (void)_startSurface:(ABI43_0_0RCTFabricSurface *)surface scheduler:(ABI43_0_0RCTScheduler *)scheduler
{
  ABI43_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [mountingManager.componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag];
  });

  LayoutContext layoutContext = ABI43_0_0RCTGetLayoutContext(surface.viewportOffset);

  LayoutConstraints layoutConstraints = ABI43_0_0RCTGetLayoutConstraintsForSize(surface.minimumSize, surface.maximumSize);

  [scheduler startSurfaceWithSurfaceId:surface.rootTag
                            moduleName:surface.moduleName
                          initialProps:surface.properties
                     layoutConstraints:layoutConstraints
                         layoutContext:layoutContext];
}

- (void)_stopSurface:(ABI43_0_0RCTFabricSurface *)surface scheduler:(ABI43_0_0RCTScheduler *)scheduler
{
  [scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  ABI43_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    surface.view.rootView = nil;
    ABI43_0_0RCTComponentViewDescriptor rootViewDescriptor =
        [mountingManager.componentViewRegistry componentViewDescriptorWithTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                           componentViewDescriptor:rootViewDescriptor];
  });

  [surface _unsetStage:(ABI43_0_0RCTSurfaceStagePrepared | ABI43_0_0RCTSurfaceStageMounted)];
}

- (void)_startAllSurfacesWithScheduler:(ABI43_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI43_0_0RCTFabricSurface *> *enumerator) {
    for (ABI43_0_0RCTFabricSurface *surface in enumerator) {
      [self _startSurface:surface scheduler:scheduler];
    }
  }];
}

- (void)_stopAllSurfacesWithScheduler:(ABI43_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI43_0_0RCTFabricSurface *> *enumerator) {
    for (ABI43_0_0RCTFabricSurface *surface in enumerator) {
      [self _stopSurface:surface scheduler:scheduler];
    }
  }];
}

- (void)_handleContentSizeCategoryDidChangeNotification:(NSNotification *)notification
{
  ABI43_0_0RCTScheduler *scheduler = [self _scheduler];

  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI43_0_0RCTFabricSurface *> *enumerator) {
    for (ABI43_0_0RCTFabricSurface *surface in enumerator) {
      LayoutContext layoutContext = ABI43_0_0RCTGetLayoutContext(surface.viewportOffset);

      LayoutConstraints layoutConstraints = ABI43_0_0RCTGetLayoutConstraintsForSize(surface.minimumSize, surface.maximumSize);

      [scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                                layoutContext:layoutContext
                                                    surfaceId:surface.rootTag];
    }
  }];
}

#pragma mark - ABI43_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  ABI43_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:ABI43_0_0RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args
{
  ABI43_0_0ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)addObserver:(id<ABI43_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI43_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI43_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI43_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ABI43_0_0ReactTag)rootTag
{
  ABI43_0_0RCTAssertMainQueue();

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI43_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(ABI43_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ABI43_0_0ReactTag)rootTag
{
  ABI43_0_0RCTAssertMainQueue();

  ABI43_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];
  ABI43_0_0RCTSurfaceStage stage = surface.stage;
  if (stage & ABI43_0_0RCTSurfaceStagePrepared) {
    // We have to progress the stage only if the preparing phase is done.
    if ([surface _setStage:ABI43_0_0RCTSurfaceStageMounted]) {
      auto rootComponentViewDescriptor =
          [_mountingManager.componentViewRegistry componentViewDescriptorWithTag:rootTag];
      surface.view.rootView = (ABI43_0_0RCTSurfaceRootView *)rootComponentViewDescriptor.view;
    }
  }

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI43_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }
}

@end
