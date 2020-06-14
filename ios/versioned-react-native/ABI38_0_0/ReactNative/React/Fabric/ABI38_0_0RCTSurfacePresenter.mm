/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSurfacePresenter.h"

#import <mutex>

#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0React/ABI38_0_0RCTComponentViewFactory.h>
#import <ABI38_0_0React/ABI38_0_0RCTComponentViewRegistry.h>
#import <ABI38_0_0React/ABI38_0_0RCTFabricSurface.h>
#import <ABI38_0_0React/ABI38_0_0RCTFollyConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTMountingManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTMountingManagerDelegate.h>
#import <ABI38_0_0React/ABI38_0_0RCTScheduler.h>
#import <ABI38_0_0React/ABI38_0_0RCTSurfaceRegistry.h>
#import <ABI38_0_0React/ABI38_0_0RCTSurfaceView+Internal.h>
#import <ABI38_0_0React/ABI38_0_0RCTSurfaceView.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

#import <ABI38_0_0React/components/root/RootShadowNode.h>
#import <ABI38_0_0React/core/LayoutConstraints.h>
#import <ABI38_0_0React/core/LayoutContext.h>
#import <ABI38_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI38_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI38_0_0React/utils/ContextContainer.h>
#import <ABI38_0_0React/utils/ManagedObjectWrapper.h>

#import "ABI38_0_0MainRunLoopEventBeat.h"
#import "ABI38_0_0RCTConversions.h"
#import "ABI38_0_0RuntimeEventBeat.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@interface ABI38_0_0RCTSurfacePresenter () <ABI38_0_0RCTSchedulerDelegate, ABI38_0_0RCTMountingManagerDelegate>
@end

@implementation ABI38_0_0RCTSurfacePresenter {
  std::mutex _schedulerMutex;
  ABI38_0_0RCTScheduler
      *_Nullable _scheduler; // Thread-safe. Mutation of the instance variable is protected by `_schedulerMutex`.
  ContextContainer::Shared _contextContainer;
  RuntimeExecutor _runtimeExecutor;
  ABI38_0_0RCTMountingManager *_mountingManager; // Thread-safe.
  ABI38_0_0RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.
  better::shared_mutex _observerListMutex;
  NSMutableArray<id<ABI38_0_0RCTSurfacePresenterObserver>> *_observers;
}

- (instancetype)initWithContextContainer:(ContextContainer::Shared)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");

    _runtimeExecutor = runtimeExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [[ABI38_0_0RCTSurfaceRegistry alloc] init];
    _mountingManager = [[ABI38_0_0RCTMountingManager alloc] init];
    _mountingManager.delegate = self;

    _observers = [NSMutableArray array];

    _scheduler = [self _createScheduler];
  }

  return self;
}

- (ABI38_0_0RCTComponentViewFactory *)componentViewFactory
{
  return _mountingManager.componentViewRegistry.componentViewFactory;
}

- (ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  return _contextContainer;
}

- (void)setContextContainer:(ContextContainer::Shared)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  _contextContainer = contextContainer;
}

- (void)setRuntimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  _runtimeExecutor = runtimeExecutor;
}

- (RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  return _runtimeExecutor;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(ABI38_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  [_surfaceRegistry registerSurface:surface];
  if (_scheduler) {
    [self _startSurface:surface];
  }
}

- (void)unregisterSurface:(ABI38_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  if (_scheduler) {
    [self _stopSurface:surface];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (void)setProps:(NSDictionary *)props surface:(ABI38_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  // This implementation is suboptimal indeed but still better than nothing for now.
  [self _stopSurface:surface];
  [self _startSurface:surface];
}

- (ABI38_0_0RCTFabricSurface *)surfaceForRootTag:(ABI38_0_0ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI38_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  LayoutContext layoutContext = {.pointScaleFactor = ABI38_0_0RCTScreenScale()};
  LayoutConstraints layoutConstraints = {.minimumSize = ABI38_0_0RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = ABI38_0_0RCTSizeFromCGSize(maximumSize)};
  return [_scheduler measureSurfaceWithLayoutConstraints:layoutConstraints
                                           layoutContext:layoutContext
                                               surfaceId:surface.rootTag];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI38_0_0RCTFabricSurface *)surface
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  LayoutContext layoutContext = {.pointScaleFactor = ABI38_0_0RCTScreenScale()};
  LayoutConstraints layoutConstraints = {.minimumSize = ABI38_0_0RCTSizeFromCGSize(minimumSize),
                                         .maximumSize = ABI38_0_0RCTSizeFromCGSize(maximumSize)};
  [_scheduler constraintSurfaceLayoutWithLayoutConstraints:layoutConstraints
                                             layoutContext:layoutContext
                                                 surfaceId:surface.rootTag];
}

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI38_0_0ReactTag props:(NSDictionary *)props
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);
  ABI38_0_0ReactTag tag = [ABI38_0_0ReactTag integerValue];
  UIView<ABI38_0_0RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  if (componentView == nil) {
    return NO; // This view probably isn't managed by Fabric
  }
  ComponentHandle handle = [[componentView class] componentDescriptorProvider].handle;
  auto *componentDescriptor = [_scheduler findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:handle];

  if (!componentDescriptor) {
    return YES;
  }

  [_mountingManager synchronouslyUpdateViewOnUIThread:tag changedProps:props componentDescriptor:*componentDescriptor];
  return YES;
}

- (BOOL)suspend
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (!_scheduler) {
    return NO;
  }

  [self _stopAllSurfaces];
  _scheduler = nil;

  return YES;
}

- (BOOL)resume
{
  std::lock_guard<std::mutex> lock(_schedulerMutex);

  if (_scheduler) {
    return NO;
  }

  _scheduler = [self _createScheduler];
  [self _startAllSurfaces];

  return YES;
}

#pragma mark - Private

- (ABI38_0_0RCTScheduler *)_createScheduler
{
  auto componentRegistryFactory = [factory = wrapManagedObject(self.componentViewFactory)](
                                      EventDispatcher::Weak const &eventDispatcher,
                                      ContextContainer::Shared const &contextContainer) {
    return [(ABI38_0_0RCTComponentViewFactory *)unwrapManagedObject(factory)
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

  ABI38_0_0RCTScheduler *scheduler = [[ABI38_0_0RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
}

- (void)_startSurface:(ABI38_0_0RCTFabricSurface *)surface
{
  ABI38_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI38_0_0RCTExecuteOnMainQueue(^{
    [mountingManager.componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag];
  });

  LayoutContext layoutContext = {.pointScaleFactor = ABI38_0_0RCTScreenScale()};

  LayoutConstraints layoutConstraints = {.minimumSize = ABI38_0_0RCTSizeFromCGSize(surface.minimumSize),
                                         .maximumSize = ABI38_0_0RCTSizeFromCGSize(surface.maximumSize)};

  [_scheduler startSurfaceWithSurfaceId:surface.rootTag
                             moduleName:surface.moduleName
                           initialProps:surface.properties
                      layoutConstraints:layoutConstraints
                          layoutContext:layoutContext];
}

- (void)_stopSurface:(ABI38_0_0RCTFabricSurface *)surface
{
  [_scheduler stopSurfaceWithSurfaceId:surface.rootTag];

  ABI38_0_0RCTMountingManager *mountingManager = _mountingManager;
  ABI38_0_0RCTExecuteOnMainQueue(^{
    ABI38_0_0RCTComponentViewDescriptor rootViewDescriptor =
        [mountingManager.componentViewRegistry componentViewDescriptorWithTag:surface.rootTag];
    [mountingManager.componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                                               tag:surface.rootTag
                                                           componentViewDescriptor:rootViewDescriptor];
  });

  [surface _unsetStage:(ABI38_0_0RCTSurfaceStagePrepared | ABI38_0_0RCTSurfaceStageMounted)];
}

- (void)_startAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI38_0_0RCTFabricSurface *> *enumerator) {
    for (ABI38_0_0RCTFabricSurface *surface in enumerator) {
      [self _startSurface:surface];
    }
  }];
}

- (void)_stopAllSurfaces
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<ABI38_0_0RCTFabricSurface *> *enumerator) {
    for (ABI38_0_0RCTFabricSurface *surface in enumerator) {
      [self _stopSurface:surface];
    }
  }];
}

#pragma mark - ABI38_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(MountingCoordinator::Shared const &)mountingCoordinator
{
  ABI38_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:mountingCoordinator->getSurfaceId()];

  [surface _setStage:ABI38_0_0RCTSurfaceStagePrepared];

  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerDidDispatchCommand:(ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args
{
  ABI38_0_0ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [self->_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)addObserver:(id<ABI38_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI38_0_0RCTSurfacePresenterObserver>)observer
{
  std::unique_lock<better::shared_mutex> lock(_observerListMutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI38_0_0RCTMountingManagerDelegate

- (void)mountingManager:(ABI38_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ABI38_0_0ReactTag)rootTag
{
  ABI38_0_0RCTAssertMainQueue();

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI38_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(ABI38_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ABI38_0_0ReactTag)rootTag
{
  ABI38_0_0RCTAssertMainQueue();

  ABI38_0_0RCTFabricSurface *surface = [_surfaceRegistry surfaceForRootTag:rootTag];
  ABI38_0_0RCTSurfaceStage stage = surface.stage;
  if (stage & ABI38_0_0RCTSurfaceStagePrepared) {
    // We have to progress the stage only if the preparing phase is done.
    if ([surface _setStage:ABI38_0_0RCTSurfaceStageMounted]) {
      auto rootComponentViewDescriptor =
          [_mountingManager.componentViewRegistry componentViewDescriptorWithTag:rootTag];
      surface.view.rootView = (ABI38_0_0RCTSurfaceRootView *)rootComponentViewDescriptor.view;
    }
  }

  std::shared_lock<better::shared_mutex> lock(_observerListMutex);
  for (id<ABI38_0_0RCTSurfacePresenterObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }
}

@end
