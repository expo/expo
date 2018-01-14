/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurface.h"
#import "ABI25_0_0RCTSurfaceView+Internal.h"

#import <mutex>

#import "ABI25_0_0RCTAssert.h"
#import "ABI25_0_0RCTBridge+Private.h"
#import "ABI25_0_0RCTBridge.h"
#import "ABI25_0_0RCTSurfaceDelegate.h"
#import "ABI25_0_0RCTSurfaceRootShadowView.h"
#import "ABI25_0_0RCTSurfaceRootShadowViewDelegate.h"
#import "ABI25_0_0RCTSurfaceRootView.h"
#import "ABI25_0_0RCTSurfaceView.h"
#import "ABI25_0_0RCTTouchHandler.h"
#import "ABI25_0_0RCTUIManager.h"
#import "ABI25_0_0RCTUIManagerUtils.h"

@interface ABI25_0_0RCTSurface () <ABI25_0_0RCTSurfaceRootShadowViewDelegate>
@end

@implementation ABI25_0_0RCTSurface {
  // Immutable
  ABI25_0_0RCTBridge *_bridge;
  NSString *_moduleName;
  NSNumber *_rootViewTag;

  // Protected by the `_mutex`
  std::mutex _mutex;
  ABI25_0_0RCTBridge *_batchedBridge;
  ABI25_0_0RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;

  // The Main thread only
  ABI25_0_0RCTSurfaceView *_Nullable _view;
  ABI25_0_0RCTTouchHandler *_Nullable _touchHandler;

  // Semaphores
  dispatch_semaphore_t _rootShadowViewDidStartRenderingSemaphore;
  dispatch_semaphore_t _rootShadowViewDidStartLayingOutSemaphore;
}

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI25_0_0RCTAssert(bridge.valid, @"Valid bridge is required to instanciate `ABI25_0_0RCTSurface`.");

  if (self = [super init]) {
    _bridge = bridge;
    _batchedBridge = [_bridge batchedBridge] ?: _bridge;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootViewTag = ABI25_0_0RCTAllocateRootViewTag();
    _rootShadowViewDidStartRenderingSemaphore = dispatch_semaphore_create(0);
    _rootShadowViewDidStartLayingOutSemaphore = dispatch_semaphore_create(0);

    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(INFINITY, INFINITY);

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeWillLoadJavaScriptNotification:)
                                                 name:ABI25_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleBridgeDidLoadJavaScriptNotification:)
                                                 name:ABI25_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    _stage = ABI25_0_0RCTSurfaceStageSurfaceDidInitialize;

    if (!bridge.loading) {
      _stage = _stage | ABI25_0_0RCTSurfaceStageBridgeDidLoad;
    }

    [self _registerRootView];
    [self _run];
  }

  return self;
}

- (void)dealloc
{
  [self _stop];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Immutable Properties (no need to enforce synchonization)

- (ABI25_0_0RCTBridge *)bridge
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

#pragma mark - Convinience Internal Thread-Safe Properties

- (ABI25_0_0RCTBridge *)_batchedBridge
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _batchedBridge;
}

- (ABI25_0_0RCTUIManager *)_uiManager
{
  return self._batchedBridge.uiManager;
}

#pragma mark - Main-Threaded Routines

- (ABI25_0_0RCTSurfaceView *)view
{
  ABI25_0_0RCTAssertMainQueue();

  if (!_view) {
    _view = [[ABI25_0_0RCTSurfaceView alloc] initWithSurface:self];

    _touchHandler = [[ABI25_0_0RCTTouchHandler alloc] initWithBridge:self.bridge];
    [_touchHandler attachToView:_view];

    [self _mountRootViewIfNeeded];
  }

  return _view;
}

- (void)_mountRootViewIfNeeded
{
  ABI25_0_0RCTAssertMainQueue();

  ABI25_0_0RCTSurfaceView *view = self->_view;
  if (!view) {
    return;
  }

  ABI25_0_0RCTSurfaceRootView *rootView =
    (ABI25_0_0RCTSurfaceRootView *)[self._uiManager viewForReactABI25_0_0Tag:self->_rootViewTag];
  if (!rootView) {
    return;
  }

  ABI25_0_0RCTAssert([rootView isKindOfClass:[ABI25_0_0RCTSurfaceRootView class]],
    @"Received root view is not an instanse of `ABI25_0_0RCTSurfaceRootView`.");

  if (rootView.superview != view) {
    view.rootView = rootView;
  }
}

#pragma mark - Bridge Events

- (void)handleBridgeWillLoadJavaScriptNotification:(NSNotification *)notification
{
  ABI25_0_0RCTAssertMainQueue();

  [self _setStage:ABI25_0_0RCTSurfaceStageBridgeDidLoad];
}

- (void)handleBridgeDidLoadJavaScriptNotification:(NSNotification *)notification
{
  ABI25_0_0RCTAssertMainQueue();

  [self _setStage:ABI25_0_0RCTSurfaceStageModuleDidLoad];

  ABI25_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];

  BOOL isRerunNeeded = NO;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (bridge != _batchedBridge) {
      _batchedBridge = bridge;
      isRerunNeeded = YES;
    }
  }

  if (isRerunNeeded) {
    [self _run];
  }
}

#pragma mark - Stage management

- (ABI25_0_0RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (void)_setStage:(ABI25_0_0RCTSurfaceStage)stage
{
  ABI25_0_0RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (_stage & stage) {
      return;
    }

    updatedStage = (ABI25_0_0RCTSurfaceStage)(_stage | stage);
    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
}

- (void)_propagateStageChange:(ABI25_0_0RCTSurfaceStage)stage
{
  // Updating the `view`
  ABI25_0_0RCTExecuteOnMainQueue(^{
    self->_view.stage = stage;
  });

  // Notifying the `delegate`
  id<ABI25_0_0RCTSurfaceDelegate> delegate = self.delegate;
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
  ABI25_0_0RCTBridge *batchedBridge;
  NSDictionary *properties;

  {
    std::lock_guard<std::mutex> lock(_mutex);

    batchedBridge = _batchedBridge;
    properties = _properties;
  }

  if (!batchedBridge.valid) {
    return;
  }

  NSDictionary *applicationParameters =
    @{
      @"rootTag": _rootViewTag,
      @"initialProps": properties,
    };

  ABI25_0_0RCTLogInfo(@"Running surface %@ (%@)", _moduleName, applicationParameters);

  [batchedBridge enqueueJSCall:@"AppRegistry"
                        method:@"runApplication"
                          args:@[_moduleName, applicationParameters]
                    completion:NULL];

  [self _setStage:ABI25_0_0RCTSurfaceStageSurfaceDidRun];
}

- (void)_stop
{
  ABI25_0_0RCTBridge *batchedBridge = self._batchedBridge;
  [batchedBridge enqueueJSCall:@"AppRegistry"
                        method:@"unmountApplicationComponentAtRootTag"
                          args:@[self->_rootViewTag]
                    completion:NULL];

  [self _setStage:ABI25_0_0RCTSurfaceStageSurfaceDidStop];
}

- (void)_registerRootView
{
  ABI25_0_0RCTBridge *batchedBridge;
  CGSize minimumSize;
  CGSize maximumSize;

  {
    std::lock_guard<std::mutex> lock(_mutex);
    batchedBridge = _batchedBridge;
    minimumSize = _minimumSize;
    maximumSize = _maximumSize;
  }

  ABI25_0_0RCTUIManager *uiManager = batchedBridge.uiManager;

  ABI25_0_0RCTExecuteOnUIManagerQueue(^{
    [uiManager registerRootViewTag:self->_rootViewTag];

    ABI25_0_0RCTSurfaceRootShadowView *rootShadowView =
      (ABI25_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForReactABI25_0_0Tag:self->_rootViewTag];
    ABI25_0_0RCTAssert([rootShadowView isKindOfClass:[ABI25_0_0RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `ABI25_0_0RCTSurfaceRootShadowView`.");

    [rootShadowView setMinimumSize:minimumSize
                       maximumSize:maximumSize];
    rootShadowView.delegate = self;
  });
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
{
  ABI25_0_0RCTUIManager *uiManager = self._uiManager;
  __block CGSize fittingSize;

  ABI25_0_0RCTUnsafeExecuteOnUIManagerQueueSync(^{
    ABI25_0_0RCTSurfaceRootShadowView *rootShadowView =
      (ABI25_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForReactABI25_0_0Tag:self->_rootViewTag];

    ABI25_0_0RCTAssert([rootShadowView isKindOfClass:[ABI25_0_0RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `ABI25_0_0RCTSurfaceRootShadowView`.");

    fittingSize = [rootShadowView sizeThatFitsMinimumSize:minimumSize
                                              maximumSize:maximumSize];
  });

  return fittingSize;
}

#pragma mark - Size Constraints

- (void)setSize:(CGSize)size
{
  [self setMinimumSize:size maximumSize:size];
}

- (void)setMinimumSize:(CGSize)minimumSize
           maximumSize:(CGSize)maximumSize
{
  {
    std::lock_guard<std::mutex> lock(_mutex);
    if (CGSizeEqualToSize(minimumSize, _minimumSize) &&
        CGSizeEqualToSize(maximumSize, _maximumSize)) {
      return;
    }

    _maximumSize = maximumSize;
    _minimumSize = minimumSize;
  }

  ABI25_0_0RCTUIManager *uiManager = self._uiManager;

  ABI25_0_0RCTUnsafeExecuteOnUIManagerQueueSync(^{
    ABI25_0_0RCTSurfaceRootShadowView *rootShadowView =
      (ABI25_0_0RCTSurfaceRootShadowView *)[uiManager shadowViewForReactABI25_0_0Tag:self->_rootViewTag];
    ABI25_0_0RCTAssert([rootShadowView isKindOfClass:[ABI25_0_0RCTSurfaceRootShadowView class]],
      @"Received shadow view is not an instanse of `ABI25_0_0RCTSurfaceRootShadowView`.");

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
  id<ABI25_0_0RCTSurfaceDelegate> delegate = self.delegate;
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

- (BOOL)synchronouslyWaitForStage:(ABI25_0_0RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  dispatch_semaphore_t semaphore;
  switch (stage) {
    case ABI25_0_0RCTSurfaceStageSurfaceDidInitialLayout:
      semaphore = _rootShadowViewDidStartLayingOutSemaphore;
      break;
    case ABI25_0_0RCTSurfaceStageSurfaceDidInitialRendering:
      semaphore = _rootShadowViewDidStartRenderingSemaphore;
      break;
    default:
      ABI25_0_0RCTAssert(NO, @"Only waiting for `ABI25_0_0RCTSurfaceStageSurfaceDidInitialRendering` and `ABI25_0_0RCTSurfaceStageSurfaceDidInitialLayout` stages is supported.");
  }

  if (ABI25_0_0RCTIsMainQueue()) {
    ABI25_0_0RCTLogInfo(@"Synchronous waiting is not supported on the main queue.");
    return NO;
  }

  if (ABI25_0_0RCTIsUIManagerQueue()) {
    ABI25_0_0RCTLogInfo(@"Synchronous waiting is not supported on UIManager queue.");
    return NO;
  }

  BOOL timeoutOccured = dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_SEC));
  if (!timeoutOccured) {
    // Balancing the semaphore.
    // Note: `dispatch_semaphore_wait` reverts the decrement in case when timeout occured.
    dispatch_semaphore_signal(semaphore);
  }

  return !timeoutOccured;
}

#pragma mark - ABI25_0_0RCTSurfaceRootShadowViewDelegate

- (void)rootShadowView:(ABI25_0_0RCTRootShadowView *)rootShadowView didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  self.intrinsicSize = intrinsicSize;
}

- (void)rootShadowViewDidStartRendering:(ABI25_0_0RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:ABI25_0_0RCTSurfaceStageSurfaceDidInitialRendering];

  dispatch_semaphore_signal(_rootShadowViewDidStartRenderingSemaphore);
}

- (void)rootShadowViewDidStartLayingOut:(ABI25_0_0RCTSurfaceRootShadowView *)rootShadowView
{
  [self _setStage:ABI25_0_0RCTSurfaceStageSurfaceDidInitialLayout];

  dispatch_semaphore_signal(_rootShadowViewDidStartLayingOutSemaphore);

  ABI25_0_0RCTExecuteOnMainQueue(^{
    // Rendering is happening, let's mount `rootView` into `view` if we already didn't do this.
    [self _mountRootViewIfNeeded];
  });
}

@end
