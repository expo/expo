/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceHostingView.h"

#import "ABI25_0_0RCTDefines.h"
#import "ABI25_0_0RCTSurface.h"
#import "ABI25_0_0RCTSurfaceDelegate.h"
#import "ABI25_0_0RCTSurfaceView.h"
#import "ABI25_0_0RCTUtils.h"

@interface ABI25_0_0RCTSurfaceHostingView () <ABI25_0_0RCTSurfaceDelegate>

@property (nonatomic, assign) BOOL isActivityIndicatorViewVisible;
@property (nonatomic, assign) BOOL isSurfaceViewVisible;

@end

@implementation ABI25_0_0RCTSurfaceHostingView {
  UIView *_Nullable _activityIndicatorView;
  UIView *_Nullable _surfaceView;
  ABI25_0_0RCTSurfaceStage _stage;
}

ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI25_0_0RCT_NOT_IMPLEMENTED(- (nullable instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI25_0_0RCTSurface *surface =
    [[ABI25_0_0RCTSurface alloc] initWithBridge:bridge
                            moduleName:moduleName
                     initialProperties:initialProperties];

  return [self initWithSurface:surface];
}

- (instancetype)initWithSurface:(ABI25_0_0RCTSurface *)surface
{
  if (self = [super initWithFrame:CGRectZero]) {
    _surface = surface;

    _sizeMeasureMode =
      ABI25_0_0RCTSurfaceSizeMeasureModeWidthAtMost |
      ABI25_0_0RCTSurfaceSizeMeasureModeHeightAtMost;

    _surface.delegate = self;
    _stage = surface.stage;
    [self _updateViews];
  }

  return self;
}

- (CGSize)intrinsicContentSize
{
  if (ABI25_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return _activityIndicatorView.intrinsicContentSize;
    }

    return CGSizeZero;
  }

  return _surface.intrinsicSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (ABI25_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return [_activityIndicatorView sizeThatFits:size];
    }

    return CGSizeZero;
  }

  CGSize minimumSize = CGSizeZero;
  CGSize maximumSize = CGSizeMake(INFINITY, INFINITY);

  if (_sizeMeasureMode & ABI25_0_0RCTSurfaceSizeMeasureModeWidthExact) {
    minimumSize.width = size.width;
    maximumSize.width = size.width;
  }
  else if (_sizeMeasureMode & ABI25_0_0RCTSurfaceSizeMeasureModeWidthAtMost) {
    maximumSize.width = size.width;
  }

  if (_sizeMeasureMode & ABI25_0_0RCTSurfaceSizeMeasureModeHeightExact) {
    minimumSize.height = size.height;
    maximumSize.height = size.height;
  }
  else if (_sizeMeasureMode & ABI25_0_0RCTSurfaceSizeMeasureModeHeightAtMost) {
    maximumSize.height = size.height;
  }

  return [_surface sizeThatFitsMinimumSize:minimumSize
                               maximumSize:maximumSize];
}

- (void)setStage:(ABI25_0_0RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  BOOL shouldInvalidateLayout =
    ABI25_0_0RCTSurfaceStageIsRunning(stage) != ABI25_0_0RCTSurfaceStageIsRunning(_stage) ||
    ABI25_0_0RCTSurfaceStageIsPreparing(stage) != ABI25_0_0RCTSurfaceStageIsPreparing(_stage);

  _stage = stage;

  if (shouldInvalidateLayout) {
    [self _invalidateLayout];
    [self _updateViews];
  }
}

- (void)setSizeMeasureMode:(ABI25_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (sizeMeasureMode == _sizeMeasureMode) {
    return;
  }

  _sizeMeasureMode = sizeMeasureMode;
  [self _invalidateLayout];
}

#pragma mark - isActivityIndicatorViewVisible

- (void)setIsActivityIndicatorViewVisible:(BOOL)visible
{
  if (_isActivityIndicatorViewVisible == visible) {
    return;
  }

  if (visible) {
    if (_activityIndicatorViewFactory) {
      _activityIndicatorView = _activityIndicatorViewFactory();
      _activityIndicatorView.frame = self.bounds;
      _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      [self addSubview:_activityIndicatorView];
    }
  } else {
    [_activityIndicatorView removeFromSuperview];
    _activityIndicatorView = nil;
  }
}

#pragma mark - isSurfaceViewVisible

- (void)setIsSurfaceViewVisible:(BOOL)visible
{
  if (_isSurfaceViewVisible == visible) {
    return;
  }

  if (visible) {
    _surfaceView = _surface.view;
    _surfaceView.frame = self.bounds;
    _surfaceView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_surfaceView];
  } else {
    [_surfaceView removeFromSuperview];
    _surfaceView = nil;
  }
}

#pragma mark - activityIndicatorViewFactory

- (void)setActivityIndicatorViewFactory:(ABI25_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory)activityIndicatorViewFactory
{
  _activityIndicatorViewFactory = activityIndicatorViewFactory;
  if (_isActivityIndicatorViewVisible) {
    _isActivityIndicatorViewVisible = NO;
    self.isActivityIndicatorViewVisible = YES;
  }
}

#pragma mark - Private stuff

- (void)_invalidateLayout
{
  [self.superview setNeedsLayout];
}

- (void)_updateViews
{
  self.isSurfaceViewVisible = ABI25_0_0RCTSurfaceStageIsRunning(_stage);
  self.isActivityIndicatorViewVisible = ABI25_0_0RCTSurfaceStageIsPreparing(_stage);
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self _updateViews];
}

#pragma mark - ABI25_0_0RCTSurfaceDelegate

- (void)surface:(ABI25_0_0RCTSurface *)surface didChangeStage:(ABI25_0_0RCTSurfaceStage)stage
{
  ABI25_0_0RCTExecuteOnMainQueue(^{
    [self setStage:stage];
  });
}

- (void)surface:(ABI25_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  ABI25_0_0RCTExecuteOnMainQueue(^{
    [self _invalidateLayout];
  });
}

@end
