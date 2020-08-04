/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTFabricSurface.h"

#import <mutex>

#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceDelegate.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceRootView.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceTouchHandler.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceView+Internal.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceView.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

#import "ABI37_0_0RCTSurfacePresenter.h"

@implementation ABI37_0_0RCTFabricSurface {
  // Immutable
  ABI37_0_0RCTSurfacePresenter *_surfacePresenter;
  NSString *_moduleName;

  // Protected by the `_mutex`
  std::mutex _mutex;
  ABI37_0_0RCTSurfaceStage _stage;
  NSDictionary *_properties;
  CGSize _minimumSize;
  CGSize _maximumSize;
  CGSize _intrinsicSize;

  // The Main thread only
  ABI37_0_0RCTSurfaceView *_Nullable _view;
  ABI37_0_0RCTSurfaceTouchHandler *_Nullable _touchHandler;
}

- (instancetype)initWithSurfacePresenter:(ABI37_0_0RCTSurfacePresenter *)surfacePresenter
                              moduleName:(NSString *)moduleName
                       initialProperties:(NSDictionary *)initialProperties
{
  if (self = [super init]) {
    _surfacePresenter = surfacePresenter;
    _moduleName = moduleName;
    _properties = [initialProperties copy];
    _rootTag = [ABI37_0_0RCTAllocateRootViewTag() integerValue];

    _minimumSize = CGSizeZero;
    // FIXME: Replace with `_maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);`.
    _maximumSize = ABI37_0_0RCTScreenSize();

    _touchHandler = [ABI37_0_0RCTSurfaceTouchHandler new];

    _stage = ABI37_0_0RCTSurfaceStageSurfaceDidInitialize;

    [_surfacePresenter registerSurface:self];
  }

  return self;
}

- (BOOL)start
{
  if (![self _setStage:ABI37_0_0RCTSurfaceStageStarted]) {
    return NO;
  }

  [_surfacePresenter startSurface:self];

  return YES;
}

- (BOOL)stop
{
  if (![self _unsetStage:ABI37_0_0RCTSurfaceStageStarted]) {
    return NO;
  }

  [_surfacePresenter unregisterSurface:self];
  return YES;
}

- (void)dealloc
{
  [self stop];
}

#pragma mark - Immutable Properties (no need to enforce synchronization)

- (NSString *)moduleName
{
  return _moduleName;
}

#pragma mark - Main-Threaded Routines

- (ABI37_0_0RCTSurfaceView *)view
{
  ABI37_0_0RCTAssertMainQueue();

  if (!_view) {
    _view = [[ABI37_0_0RCTSurfaceView alloc] initWithSurface:(ABI37_0_0RCTSurface *)self];
    [_touchHandler attachToView:_view];
  }

  return _view;
}

#pragma mark - Stage management

- (ABI37_0_0RCTSurfaceStage)stage
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _stage;
}

- (BOOL)_setStage:(ABI37_0_0RCTSurfaceStage)stage
{
  return [self _setStage:stage setOrUnset:YES];
}

- (BOOL)_unsetStage:(ABI37_0_0RCTSurfaceStage)stage
{
  return [self _setStage:stage setOrUnset:NO];
}

- (BOOL)_setStage:(ABI37_0_0RCTSurfaceStage)stage setOrUnset:(BOOL)setOrUnset
{
  ABI37_0_0RCTSurfaceStage updatedStage;
  {
    std::lock_guard<std::mutex> lock(_mutex);

    if (setOrUnset) {
      updatedStage = (ABI37_0_0RCTSurfaceStage)(_stage | stage);
    } else {
      updatedStage = (ABI37_0_0RCTSurfaceStage)(_stage & ~stage);
    }

    if (updatedStage == _stage) {
      return NO;
    }

    _stage = updatedStage;
  }

  [self _propagateStageChange:updatedStage];
  return YES;
}

- (void)_propagateStageChange:(ABI37_0_0RCTSurfaceStage)stage
{
  // Updating the `view`
  ABI37_0_0RCTExecuteOnMainQueue(^{
    self->_view.stage = stage;
  });

  // Notifying the `delegate`
  id<ABI37_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeStage:)]) {
    [delegate surface:(ABI37_0_0RCTSurface *)self didChangeStage:stage];
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

  [_surfacePresenter setProps:properties surface:self];
}

#pragma mark - Layout

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  return [_surfacePresenter sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize surface:self];
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

  [_surfacePresenter setMinimumSize:minimumSize maximumSize:maximumSize surface:self];
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
  id<ABI37_0_0RCTSurfaceDelegate> delegate = self.delegate;
  if ([delegate respondsToSelector:@selector(surface:didChangeIntrinsicSize:)]) {
    [delegate surface:(ABI37_0_0RCTSurface *)(id)self didChangeIntrinsicSize:intrinsicSize];
  }
}

- (CGSize)intrinsicSize
{
  std::lock_guard<std::mutex> lock(_mutex);
  return _intrinsicSize;
}

#pragma mark - Synchronous Waiting

- (BOOL)synchronouslyWaitForStage:(ABI37_0_0RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout
{
  // TODO: Not supported yet.
  return NO;
}

#pragma mark - Deprecated

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  return [self initWithSurfacePresenter:bridge.surfacePresenter
                             moduleName:moduleName
                      initialProperties:initialProperties];
}

- (NSNumber *)rootViewTag
{
  return @(_rootTag);
}

@end
