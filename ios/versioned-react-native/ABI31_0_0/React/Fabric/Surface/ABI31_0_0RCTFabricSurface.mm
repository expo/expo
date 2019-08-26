/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTFabricSurface.h"

#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceView+Internal.h>

#import <mutex>
#import <stdatomic.h>

#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceDelegate.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceRootView.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceView.h>
#import <ReactABI31_0_0/ABI31_0_0RCTSurfaceTouchHandler.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerUtils.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUtils.h>

#import "ABI31_0_0RCTSurfacePresenter.h"
#import "ABI31_0_0RCTMountingManager.h"

@implementation ABI31_0_0RCTFabricSurface {
  // Immutable
  ABI31_0_0RCTSurfacePresenter *_surfacePresenter;
  NSString *_moduleName;

  // Protected by the `_mutex`
  std::mutex _mutex;
  ABI31_0_0RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;

  // The Main thread only
  ABI31_0_0RCTSurfaceView *_Nullable _view;
  ABI31_0_0RCTSurfaceTouchHandler *_Nullable _touchHandler;
}

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI31_0_0RCTAssert(bridge.valid, @"Valid bridge is required to instanciate `ABI31_0_0RCTSurface`.");

  self = [self initWithSurfacePresenter:bridge.surfacePresenter
                             moduleName:moduleName
                      initialProperties:initialProperties];

  return self;
}

- (instancetype)initWithSurfacePresenter:(ABI31_0_0RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties
{
  if (self = [super init]) {
    _surfacePresenter = surfacePresenter;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootTag = [ABI31_0_0RCTAllocateRootViewTag() integerValue];

    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    _stage = ABI31_0_0RCTSurfaceStageSurfaceDidInitialize;

    _touchHandler = [ABI31_0_0RCTSurfaceTouchHandler new];

    [self _run];

    // TODO: This will be moved to ABI31_0_0RCTSurfacePresenter.
    ABI31_0_0RCTBridge *bridge = surfacePresenter.bridge_DO_NOT_USE;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptWillStartLoadingNotification:)
                                                 name:ABI31_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:bridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleJavaScriptDidLoadNotification:)
                                                 name:ABI31_0_0RCTJavaScriptDidLoadNotification
                                               object:bridge];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [self _stop];
}

#pragma mark - Immutable Properties (no need to enforce synchonization)

- (NSString *)moduleName
{
  return _moduleName;
}

- (NSNumber *)rootViewTag
{
  return @(_rootTag);
}

#pragma mark - Main-Threaded Routines

- (ABI31_0_0RCTSurfaceView *)view
{
  ABI31_0_0RCTAssertMainQueue();

  if (!_view) {
    _view = [[ABI31_0_0RCTSurfaceView alloc] initWithSurface:(ABI31_0_0RCTSurface *)self];
    [_touchHandler attachToView:_view];
  }

  return _view;
}

#pragma mark - Stage management

- (ABI31_0_0RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (void)_setStage:(ABI31_0_0RCTSurfaceStage)stage
{
  ABI31_0_0RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (_stage & stage) {
      return;
    }

    updatedStage = (ABI31_0_0RCTSurfaceStage)(_stage | stage);
    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
}

- (void)_propagateStageChange:(ABI31_0_0RCTSurfaceStage)stage
{
  // Updating the `view`
  ABI31_0_0RCTExecuteOnMainQueue(^{
    self->_view.stage = stage;
  });

  // Notifying the `delegate`
  id<ABI31_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeStage:)]) {
    [delegate surface:(ABI31_0_0RCTSurface *)self didChangeStage:stage];
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
  [_surfacePresenter registerSurface:self];
  [self _setStage:ABI31_0_0RCTSurfaceStageSurfaceDidRun];
}

- (void)_stop
{
  [_surfacePresenter unregisterSurface:self];
  [self _setStage:ABI31_0_0RCTSurfaceStageSurfaceDidStop];
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
{
  return [_surfacePresenter sizeThatFitsMinimumSize:minimumSize
                                        maximumSize:maximumSize
                                            surface:self];
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

  return [_surfacePresenter setMinimumSize:minimumSize
                               maximumSize:maximumSize
                                   surface:self];
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
  id<ABI31_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeIntrinsicSize:)]) {
    [delegate surface:(ABI31_0_0RCTSurface *)(id)self didChangeIntrinsicSize:intrinsicSize];
  }
}

- (CGSize)intrinsicSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _intrinsicSize;
}

#pragma mark - Synchronous Waiting

- (BOOL)synchronouslyWaitForStage:(ABI31_0_0RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  // TODO: Not supported yet.
  return NO;
}

#pragma mark - Bridge events

- (void)handleJavaScriptWillStartLoadingNotification:(NSNotification *)notification
{
  // TODO: Move the bridge lifecycle handling up to the ABI31_0_0RCTSurfacePresenter.

  ABI31_0_0RCTAssertMainQueue();

  // Reset states because the bridge is reloading. This is similar to initialization phase.
  _stage = ABI31_0_0RCTSurfaceStageSurfaceDidInitialize;
  _view = nil;
  _touchHandler = [ABI31_0_0RCTSurfaceTouchHandler new];
  [self _setStage:ABI31_0_0RCTSurfaceStageBridgeDidLoad];
}

- (void)handleJavaScriptDidLoadNotification:(NSNotification *)notification
{
  // TODO: Move the bridge lifecycle handling up to the ABI31_0_0RCTSurfacePresenter.

  // Note: this covers both JS reloads and initial load after the bridge starts.
  // When it's not a reload, surface should already be running since we run it immediately in the initializer, so do
  // nothing.
  // When it's a reload, we rely on the `ABI31_0_0RCTJavaScriptWillStartLoadingNotification` notification to reset the stage,
  // then we need to run the surface and update its size.
  if (!ABI31_0_0RCTSurfaceStageIsRunning(_stage)) {
    [self _setStage:ABI31_0_0RCTSurfaceStageModuleDidLoad];
    [self _run];

    // After a reload surfacePresenter needs to know the last min/max size for this surface, because the surface hosting
    // view was already attached to the ViewController's view.
    // TODO: Find a better automatic way.
    [_surfacePresenter setMinimumSize:_minimumSize
                          maximumSize:_maximumSize
                              surface:self];
  }
}

@end
