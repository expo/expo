/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTSurface.h"
#import "ABI42_0_0RCTSurfaceView+Internal.h"

#import <mutex>

#import <stdatomic.h>

#import "ABI42_0_0RCTAssert.h"
#import "ABI42_0_0RCTBridge+Private.h"
#import "ABI42_0_0RCTBridge.h"
#import "ABI42_0_0RCTShadowView+Layout.h"
#import "ABI42_0_0RCTSurfaceDelegate.h"
#import "ABI42_0_0RCTSurfaceRootShadowView.h"
#import "ABI42_0_0RCTSurfaceRootShadowViewDelegate.h"
#import "ABI42_0_0RCTSurfaceRootView.h"
#import "ABI42_0_0RCTSurfaceView.h"
#import "ABI42_0_0RCTTouchHandler.h"
#import "ABI42_0_0RCTUIManager.h"
#import "ABI42_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI42_0_0RCTUIManagerUtils.h"

@interface ABI42_0_0RCTSurface () <ABI42_0_0RCTSurfaceRootShadowViewDelegate, ABI42_0_0RCTUIManagerObserver>
@end

@implementation ABI42_0_0RCTSurface {
  // Immutable
  ABI42_0_0RCTBridge *_bridge;
  NSString *_moduleName;
  NSNumber *_rootViewTag;

  // Protected by the `_mutex`
  std::mutex _mutex;
  ABI42_0_0RCTBridge *_batchedBridge;
  ABI42_0_0RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;
  ABI42_0_0RCTUIManagerMountingBlock _mountingBlock;

  // The Main thread only
  ABI42_0_0RCTSurfaceView *_Nullable _view;
  ABI42_0_0RCTTouchHandler *_Nullable _touchHandler;

  // Semaphores
  dispatch_semaphore_t _rootShadowViewDidStartRenderingSemaphore;
  dispatch_semaphore_t _rootShadowViewDidStartLayingOutSemaphore;
  dispatch_semaphore_t _uiManagerDidPerformMountingSemaphore;

  // Atomics
  atomic_bool _waitingForMountingStageOnMainQueue;
}

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI42_0_0RCTAssert(bridge.valid, @"Valid bridge is required to instantiate `ABI42_0_0RCTSurface`.");

  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootViewTag = ABI42_0_0RCTAllocateRootViewTag();

    _rootShadowViewDidStartRenderingSemaphore = dispatch_semaphore_create(0);
    _rootShadowViewDidStartLayingOutSemaphore = dispatch_semaphore_create(0);
    _uiManagerDidPerformMountingSemaphore = dispatch_semaphore_create(0);

    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillLoadJavaScriptNotification:)
                                                 name:ABI42_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeDidLoadJavaScriptNotification:)
                                                 name:ABI42_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    _stage = ABI42_0_0RCTSurfaceStageSurfaceDidInitialize;

    if (!bridge.loading) {
      _stage = _stage | ABI42_0_0RCTSurfaceStageBridgeDidLoad;
    }

    [_bridge.uiManager.observerCoordinator addObserver:self];

    [self _registerRootView];
    [self _run];
  }

  return self;
}

- (void)dealloc
{
  [self _stop];
}

#pragma mark - Immutable Properties (no need to enforce synchronization)

- (ABI42_0_0RCTBridge *)bridge
{
  return _bridge;
}

- (NSString *)moduleName
{
  return _moduleName;
}

- (NSNumber *)rootViewTag
{
  return _rootViewTag;
}

#pragma mark - Convenience Internal Thread-Safe Properties

- (ABI42_0_0RCTBridge *)_batchedBridge
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _batchedBridge;
}

- (ABI42_0_0RCTUIManager *)_uiManager
{
  return self._batchedBridge.uiManager;
}

#pragma mark - Main-Threaded Routines

- (ABI42_0_0RCTSurfaceView *)view
{
  ABI42_0_0RCTAssertMainQueue();

  if (!_view) {
    _view = [[ABI42_0_0RCTSurfaceView alloc] initWithSurface:self];

    _touchHandler = [[ABI42_0_0RCTTouchHandler alloc] initWithBridge:self.bridge];
    [_touchHandler attachToView:_view];

    [self _mountRootViewIfNeeded];
  }

  return _view;
}

- (void)_mountRootViewIfNeeded
{
  ABI42_0_0RCTAssertMainQueue();

  ABI42_0_0RCTSurfaceView *view = self->_view;
  if (!view) {
    return;
  }

  ABI42_0_0RCTSurfaceRootView *rootView = (ABI42_0_0RCTSurfaceRootView *)[self._uiManager viewForABI42_0_0ReactTag:self->_rootViewTag];
  if (!rootView) {
    return;
  }

  ABI42_0_0RCTAssert(
      [rootView isKindOfClass:[ABI42_0_0RCTSurfaceRootView class]],
      @"Received root view is not an instance of `ABI42_0_0RCTSurfaceRootView`.");

  if (rootView.superview != view) {
    view.rootView = rootView;
  }
}

#pragma mark - Bridge Events

- (void)handleBridgeWillLoadJavaScriptNotification:(__unused NSNotification *)notification
{
  ABI42_0_0RCTAssertMainQueue();

  // Reset states because the bridge is reloading. This is similar to initialization phase.
  _stage = ABI42_0_0RCTSurfaceStageSurfaceDidInitialize;
  _view = nil;
  _touchHandler = nil;
  [self _setStage:ABI42_0_0RCTSurfaceStageBridgeDidLoad];
}

- (void)handleBridgeDidLoadJavaScriptNotification:(NSNotification *)notification
{
  ABI42_0_0RCTAssertMainQueue();

  [self _setStage:ABI42_0_0RCTSurfaceStageModuleDidLoad];

  ABI42_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];

  BOOL isRerunNeeded = NO;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (bridge != _batchedBridge) {
      _batchedBridge = bridge;
      isRerunNeeded = YES;
    }
  }

  if (isRerunNeeded) {
    [self _registerRootView];
    [self _run];
  }
}

#pragma mark - Stage management

- (ABI42_0_0RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (void)_setStage:(ABI42_0_0RCTSurfaceStage)stage
{
  ABI42_0_0RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (_stage & stage) {
      return;
    }

    updatedStage = (ABI42_0_0RCTSurfaceStage)(_stage | stage);
    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
}

- (void)_propagateStageChange:(ABI42_0_0RCTSurfaceStage)stage
{
  // Updating the `view`
  ABI42_0_0RCTExecuteOnMainQueue(^{
    self->_view.stage = stage;
  });

  // Notifying the `delegate`
  id<ABI42_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeStage:)]) {
    [delegate surface:self didChangeStage:stage];
  }
}

#pragma mark - Properties Management

- (NSDictionary *)properties
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _properties;
}

- (void)setProperties:(NSDictionary *)properties
{
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if ([properties isEqualToDictionary:_properties]) {
      return;
    }

    _properties = [properties copy];
  }

  [self _run];
}

#pragma mark - Running

- (void)_run
{
  ABI42_0_0RCTBridge *batchedBridge;
  NSDictionary *properties;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    batchedBridge = _batchedBridge;
    properties = _properties;
  }

  if (!batchedBridge.valid) {
    return;
  }

  NSDictionary *applicationParameters = @{
    @"rootTag" : _rootViewTag,
    @"initialProps" : properties,
  };

  ABI42_0_0RCTLogInfo(@"Running surface %@ (%@)", _moduleName, applicationParameters);

  [self mountABI42_0_0ReactComponentWithBridge:batchedBridge moduleName:_moduleName params:applicationParameters];

  [self _setStage:ABI42_0_0RCTSurfaceStageSurfaceDidRun];
}

- (void)_stop
{
  [self unmountABI42_0_0ReactComponentWithBridge:self._batchedBridge rootViewTag:self->_rootViewTag];
}

- (void)_registerRootView
{
  ABI42_0_0RCTBridge *batchedBridge;
  CGSize minimumSize;
  CGSize maximumSize;

  {
    std::lock_guard<std::mutex> lock(_mutex);
    batchedBridge = _batchedBridge;
    minimumSize = _minimumSize;
    maximumSize = _maximumSize;
  }

  ABI42_0_0RCTUIManager *uiManager = batchedBridge.uiManager;

  // If we are on the main queue now, we have to proceed synchronously.
  // Otherwise, we cannot perform synchronous waiting for some stages later.
  (ABI42_0_0RCTIsMainQueue() ? ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync : ABI42_0_0RCTExecuteOnUIManagerQueue)(^{
    [uiManager registerRootViewTag:self->_rootViewTag];

    ABI42_0_0RCTSurfaceRootShadowView *rootShadowView =
        (ABI42_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForABI42_0_0ReactTag:self->_rootViewTag];
    ABI42_0_0RCTAssert(
        [rootShadowView isKindOfClass:[ABI42_0_0RCTSurfaceRootShadowView class]],
        @"Received shadow view is not an instance of `ABI42_0_0RCTSurfaceRootShadowView`.");

    [rootShadowView setMinimumSize:minimumSize maximumSize:maximumSize];
    rootShadowView.delegate = self;
  });
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  ABI42_0_0RCTUIManager *uiManager = self._uiManager;
  __block CGSize fittingSize;

  ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync(^{
    ABI42_0_0RCTSurfaceRootShadowView *rootShadowView =
        (ABI42_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForABI42_0_0ReactTag:self->_rootViewTag];

    ABI42_0_0RCTAssert(
        [rootShadowView isKindOfClass:[ABI42_0_0RCTSurfaceRootShadowView class]],
        @"Received shadow view is not an instance of `ABI42_0_0RCTSurfaceRootShadowView`.");

    fittingSize = [rootShadowView sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];
  });

  return fittingSize;
}

#pragma mark - Size Constraints

- (void)setSize:(CGSize)size
{
  [self setMinimumSize:size maximumSize:size];
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(minimumSize, _minimumSize) && CGSizeEqualToSize(maximumSize, _maximumSize)) {
      return;
    }

    _maximumSize = maximumSize;
    _minimumSize = minimumSize;
  }

  ABI42_0_0RCTUIManager *uiManager = self._uiManager;

  ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync(^{
    ABI42_0_0RCTSurfaceRootShadowView *rootShadowView =
        (ABI42_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForABI42_0_0ReactTag:self->_rootViewTag];
    ABI42_0_0RCTAssert(
        [rootShadowView isKindOfClass:[ABI42_0_0RCTSurfaceRootShadowView class]],
        @"Received shadow view is not an instance of `ABI42_0_0RCTSurfaceRootShadowView`.");

    [rootShadowView setMinimumSize:minimumSize maximumSize:maximumSize];
    [uiManager setNeedsLayout];
  });
}

- (CGSize)minimumSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _minimumSize;
}

- (CGSize)maximumSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _maximumSize;
}

#pragma mark - intrinsicSize

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(intrinsicSize, _intrinsicSize)) {
      return;
    }

    _intrinsicSize = intrinsicSize;
  }

  // Notifying `delegate`
  id<ABI42_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeIntrinsicSize:)]) {
    [delegate surface:self didChangeIntrinsicSize:intrinsicSize];
  }
}

- (CGSize)intrinsicSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _intrinsicSize;
}

#pragma mark - Synchronous Waiting

- (BOOL)synchronouslyWaitForStage:(ABI42_0_0RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  if (ABI42_0_0RCTIsUIManagerQueue()) {
    ABI42_0_0RCTLogInfo(@"Synchronous waiting is not supported on UIManager queue.");
    return NO;
  }

  if (ABI42_0_0RCTIsMainQueue() && (stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting)) {
    // All main-threaded execution (especially mounting process) has to be
    // intercepted, captured and performed synchronously at the end of this method
    // right after the semaphore signals.

    // Atomic variant of `_waitingForMountingStageOnMainQueue = YES;`
    atomic_fetch_or(&_waitingForMountingStageOnMainQueue, 1);
  }

  dispatch_semaphore_t semaphore;
  switch (stage) {
    case ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout:
      semaphore = _rootShadowViewDidStartLayingOutSemaphore;
      break;
    case ABI42_0_0RCTSurfaceStageSurfaceDidInitialRendering:
      semaphore = _rootShadowViewDidStartRenderingSemaphore;
      break;
    case ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting:
      semaphore = _uiManagerDidPerformMountingSemaphore;
      break;
    default:
      ABI42_0_0RCTAssert(
          NO,
          @"Only waiting for `ABI42_0_0RCTSurfaceStageSurfaceDidInitialRendering`, `ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout` and `ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting` stages are supported.");
  }

  BOOL timeoutOccurred = dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_SEC));

  // Atomic equivalent of `_waitingForMountingStageOnMainQueue = NO;`.
  atomic_fetch_and(&_waitingForMountingStageOnMainQueue, 0);

  if (!timeoutOccurred) {
    // Balancing the semaphore.
    // Note: `dispatch_semaphore_wait` reverts the decrement in case when timeout occurred.
    dispatch_semaphore_signal(semaphore);
  }

  if (ABI42_0_0RCTIsMainQueue() && (stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting)) {
    // Time to apply captured mounting block.
    ABI42_0_0RCTUIManagerMountingBlock mountingBlock;
    {
      std::lock_guard<std::mutex> lock(_mutex);
      mountingBlock = _mountingBlock;
      _mountingBlock = nil;
    }

    if (mountingBlock) {
      mountingBlock();
      [self _mountRootViewIfNeeded];
    }
  }

  return !timeoutOccurred;
}

#pragma mark - ABI42_0_0RCTSurfaceRootShadowViewDelegate

- (void)rootShadowView:(__unused ABI42_0_0RCTRootShadowView *)rootShadowView didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  self.intrinsicSize = intrinsicSize;
}

- (void)rootShadowViewDidStartRendering:(__unused ABI42_0_0RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:ABI42_0_0RCTSurfaceStageSurfaceDidInitialRendering];

  dispatch_semaphore_signal(_rootShadowViewDidStartRenderingSemaphore);
}

- (void)rootShadowViewDidStartLayingOut:(__unused ABI42_0_0RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout];

  dispatch_semaphore_signal(_rootShadowViewDidStartLayingOutSemaphore);

  ABI42_0_0RCTExecuteOnMainQueue(^{
    // Rendering is happening, let's mount `rootView` into `view` if we already didn't do this.
    [self _mountRootViewIfNeeded];
  });
}

#pragma mark - ABI42_0_0RCTUIManagerObserver

- (BOOL)uiManager:(__unused ABI42_0_0RCTUIManager *)manager performMountingWithBlock:(ABI42_0_0RCTUIManagerMountingBlock)block
{
  if (atomic_load(&_waitingForMountingStageOnMainQueue) && (self.stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout)) {
    // Atomic equivalent of `_waitingForMountingStageOnMainQueue = NO;`.
    atomic_fetch_and(&_waitingForMountingStageOnMainQueue, 0);

    {
      std::lock_guard<std::mutex> lock(_mutex);
      _mountingBlock = block;
    }
    return YES;
  }

  return NO;
}

- (void)uiManagerDidPerformMounting:(__unused ABI42_0_0RCTUIManager *)manager
{
  if (self.stage & ABI42_0_0RCTSurfaceStageSurfaceDidInitialLayout) {
    [self _setStage:ABI42_0_0RCTSurfaceStageSurfaceDidInitialMounting];
    dispatch_semaphore_signal(_uiManagerDidPerformMountingSemaphore);

    // No need to listen to UIManager anymore.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^{
      [self->_bridge.uiManager.observerCoordinator removeObserver:self];
    });
  }
}

- (BOOL)start
{
  // Does nothing.
  // The Start&Stop feature is not implemented for regular Surface yet.
  return YES;
}

- (BOOL)stop
{
  // Does nothing.
  // The Start&Stop feature is not implemented for regular Surface yet.
  return YES;
}

#pragma mark - Mounting/Unmounting of ABI42_0_0React components

- (void)mountABI42_0_0ReactComponentWithBridge:(ABI42_0_0RCTBridge *)bridge
                           moduleName:(NSString *)moduleName
                               params:(NSDictionary *)params
{
  [bridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[ moduleName, params ] completion:NULL];
}

- (void)unmountABI42_0_0ReactComponentWithBridge:(ABI42_0_0RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag
{
  [bridge enqueueJSCall:@"AppRegistry"
                 method:@"unmountApplicationComponentAtRootTag"
                   args:@[ rootViewTag ]
             completion:NULL];
}

@end
