/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSurfacePresenter.h"

#import <mutex>

#import <ABI41_0_0React/ABI41_0_0RCTAssert.h>
#import <ABI41_0_0React/ABI41_0_0RCTComponentViewFactory.h>
#import <ABI41_0_0React/ABI41_0_0RCTComponentViewRegistry.h>
#import <ABI41_0_0React/ABI41_0_0RCTFabricSurface.h>
#import <ABI41_0_0React/ABI41_0_0RCTFollyConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTI18nUtil.h>
#import <ABI41_0_0React/ABI41_0_0RCTMountingManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTMountingManagerDelegate.h>
#import <ABI41_0_0React/ABI41_0_0RCTScheduler.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfaceRegistry.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfaceView+Internal.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfaceView.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

#import <ABI41_0_0React/components/root/RootShadowNode.h>
#import <ABI41_0_0React/core/LayoutConstraints.h>
#import <ABI41_0_0React/core/LayoutContext.h>
#import <ABI41_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI41_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI41_0_0React/utils/ContextContainer.h>
#import <ABI41_0_0React/utils/ManagedObjectWrapper.h>

#import "ABI41_0_0MainRunLoopEventBeat.h"
#import "ABI41_0_0RCTConversions.h"
#import "ABI41_0_0RuntimeEventBeat.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

static inline LayoutConstraints ABI41_0_0RCTGetLayoutConstraintsForSize(CGSize minimumSize, CGSize maximumSize)
{
  return {
      .minimumSize = ABI41_0_0RCTSizeFromCGSize(minimumSize),
      .maximumSize = ABI41_0_0RCTSizeFromCGSize(maximumSize),
      .layoutDirection = ABI41_0_0RCTLayoutDirection([[ABI41_0_0RCTI18nUtil sharedInstance] isRTL]),
  };
}

static inline LayoutContext ABI41_0_0RCTGetLayoutContext()
{
  return {.pointScaleFactor = ABI41_0_0RCTScreenScale(),
          .swapLeftAndRightInRTL =
              [[ABI41_0_0RCTI18nUtil sharedInstance] isRTL] && [[ABI41_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]};
}

@interface ABI41_0_0RCTSurfacePresenter () <ABI41_0_0RCTSchedulerDelegate, ABI41_0_0RCTMountingManagerDelegate>
@end

@implementation ABI41_0_0RCTSurfacePresenter {
  ABI41_0_0RCTMountingManager *_mountingManager; // Thread-safe.
  ABI41_0_0RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.

  std::mutex _schedulerAccessMutex;
  std::mutex _schedulerLifeCycleMutex;
  ABI41_0_0RCTScheduler *_Nullable _scheduler; // Thread-safe. Pointer is protected by `_schedulerAccessMutex`.
  ContextContainer::Shared _contextContainer; // Protected by `_schedulerLifeCycleMutex`.
  RuntimeExecutor _runtimeExecutor; // Protected by `_schedulerLifeCycleMutex`.

  better::shared_mutex _observerListMutex;
  NSMutableArray<id<ABI41_0_0RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithContextContainer:(ContextContainer::Shared)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");

    _runtimeExecutor = runtimeExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [[ABI41_0_0RCTSurfaceRegistry alloc] init];
    _mountingManager = [[ABI41_0_0RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    _observers = [NSMutableArray array];

    _scheduler = [self _createScheduler];
  }

  return self;
}

- (ABI41_0_0RCTScheduler *_Nullable)_scheduler
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

- (void)registerSurface:(ABI41_0_0RCTFabricSurface *)surface
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  [_surfaceRegistry registerSurface:surface];
  if (scheduler) {
    [self _startSurface:surface scheduler:scheduler];
  }
}

- (void)unregisterSurface:(ABI41_0_0RCTFabricSurface *)surface
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [self _stopSurface:surface scheduler:scheduler];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props surface:(ABI41_0_0RCTFabricSurface *)surface
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  if (scheduler) {
    [self _stopSurface:surface scheduler:scheduler];
    [self _startSurface:surface scheduler:scheduler];
  }
}

- (ABI41_0_0RCTFabricSurface *)surfaceForRootTag:(ABI41_0_0ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI41_0_0RCTFabricSurface *)surface
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return minimumSize;
  }
  LayoutContext layoutContext = ABI41_0_0RCTGetLayoutContext();
  LayoutConstraints layoutConstraints = ABI41_0_0RCTGetLayoutConstraintsForSize(minimumSize, maximumSize);
  return [scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                          layoutContext:layoutContext
                                              surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI41_0_0RCTFabricSurface *)surface
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return;
  }

  LayoutContext layoutContext = ABI41_0_0RCTGetLayoutContext();
  LayoutConstraints layoutConstraints = ABI41_0_0RCTGetLayoutConstraintsForSize(minimumSize, maximumSize);
  [scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                            layoutContext:layoutContext
                                                surfaceId:surface.rootTag];
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI41_0_0ReactTag props:(NSDictionary *)props
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
  if (!scheduler) {
    return NO;
  }

  ABI41_0_0ReactTag tag = [ABI41_0_0ReactTag integerValue];
  UIView<ABI41_0_0RCTComponentViewProtocol> *componentView =
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

- (BOOL)synchronouslyWaitSurface:(ABI41_0_0RCTFabricSurface *)surface timeout:(NSTimeInterval)timeout
{
  ABI41_0_0RCTScheduler *scheduler = [self _scheduler];
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

  ABI41_0_0RCTScheduler *scheduler;
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

  ABI41_0_0RCTScheduler *scheduler;
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

- (ABI41_0_0RCTScheduler *)_createScheduler
{
  auto componentRegistryFactory =
      [factory = wrapManagedObject(_mountingManager.componentViewRegistry.componentViewFactory)](
          EventDispatcher::Weak const &eventDispatcher, ContextContainer::Shared const &contextContainer) {
        return [(ABI41_0_0RCTComponentViewFactory *)unwrapManagedObject(factory)
            createComponentDescriptorRegistryWithParameters:{eventDispatcher, contextContainer}];
      };

  auto runtimeExecutor = _runtimeExecutor;

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = _contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;
  toolbox.runtimeExecutor = runtimeExecutor;

  toolbox.synchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    return std::make_unique<MainRunLoopEventBeat>(ownerBox, runtimeExecutor);
  };

  toolbox.asynchronousEventBeatFactory = [runtimeExecutor](EventBeat::SharedOwnerBox const &ownerBox) {
    return std::make_unique<RuntimeEventBeat>(ownerBox, runtimeExecutor);
  };

  ABI41_0_0RCTScheduler *scheduler = [[ABI41_0_0RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
}

- (void)_startSurface:(ABI41_0_0RCTFabricSurface *)surface scheduler:(ABI41_0_0RCTScheduler *)scheduler
{
  ABI41_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI41_0_0RCTExecuteOnMainQueue(^{
    [mountingManager.componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag];
  });

  LayoutContext layoutContext = ABI41_0_0RCTGetLayoutContext();

  LayoutConstraints layoutConstraints = ABI41_0_0RCTGetLayoutConstraintsForSize(surface.minimumSize, surface.maximumSize);

  [scheduler startSurfaceWithSurfaceId:surface.rootTag
                            moduleName:surface.moduleName
                          initialProps:surface.properties
                     layoutConstraints:layoutConstraints
                         layoutContext:layoutContext];
}

- (void)_stopSurface:(ABI41_0_0RCTFabricSurface *)surface scheduler:(ABI41_0_0RCTScheduler *)scheduler
{
  [scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  ABI41_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI41_0_0RCTExecuteOnMainQueue(^{
    ABI41_0_0RCTComponentViewDescriptor rootViewDescriptor =
        [mountingManager.componentViewRegistry componentViewDescriptorWithTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                           componentViewDescriptor:rootViewDescriptor];
  });

  [surface _unsetStage:(ABI41_0_0RCTSurfaceStagePrepared | ABI41_0_0RCTSurfaceStageMounted)];
}

- (void)_startAllSurfacesWithScheduler:(ABI41_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI41_0_0RCTFabricSurface *> *enumerator) {
    for (ABI41_0_0RCTFabricSurface *surface in enumerator) {
      [self _startSurface:surface scheduler:scheduler];
    }
  }];
}

- (void)_stopAllSurfacesWithScheduler:(ABI41_0_0RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI41_0_0RCTFabricSurface *> *enumerator) {
    for (ABI41_0_0RCTFabricSurface *surface in enumerator) {
      [self _stopSurface:surface scheduler:scheduler];
    }
  }];
}

#pragma mark - ABI41_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  ABI41_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:ABI41_0_0RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args
{
  ABI41_0_0ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)addObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI41_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI41_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ABI41_0_0ReactTag)rootTag
{
  ABI41_0_0RCTAssertMainQueue();

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI41_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(ABI41_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ABI41_0_0ReactTag)rootTag
{
  ABI41_0_0RCTAssertMainQueue();

  ABI41_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];
  ABI41_0_0RCTSurfaceStage stage = surface.stage;
  if (stage & ABI41_0_0RCTSurfaceStagePrepared) {
    // We have to progress the stage only if the preparing phase is done.
    if ([surface _setStage:ABI41_0_0RCTSurfaceStageMounted]) {
      auto rootComponentViewDescriptor =
          [_mountingManager.componentViewRegistry componentViewDescriptorWithTag:rootTag];
      surface.view.rootView = (ABI41_0_0RCTSurfaceRootView *)rootComponentViewDescriptor.view;
    }
  }

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI41_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }
}

@end
