/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTSurfaceHostingView.h"

#import "ABI42_0_0RCTConstants.h"
#import "ABI42_0_0RCTDefines.h"
#import "ABI42_0_0RCTSurface.h"
#import "ABI42_0_0RCTSurfaceDelegate.h"
#import "ABI42_0_0RCTSurfaceView.h"
#import "ABI42_0_0RCTUtils.h"

@interface ABI42_0_0RCTSurfaceHostingView ()

@property (nonatomic, assign) BOOL isActivityIndicatorViewVisible;
@property (nonatomic, assign) BOOL isSurfaceViewVisible;

@end

@implementation ABI42_0_0RCTSurfaceHostingView {
  UIView *_Nullable _activityIndicatorView;
  UIView *_Nullable _surfaceView;
  ABI42_0_0RCTSurfaceStage _stage;
}

+ (ABI42_0_0RCTSurface *)createSurfaceWithBridge:(ABI42_0_0RCTBridge *)bridge
                             moduleName:(NSString *)moduleName
                      initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI42_0_0RCTSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)
ABI42_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI42_0_0RCT_NOT_IMPLEMENTED(-(nullable instancetype)initWithCoder : (NSCoder *)coder)

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
               sizeMeasureMode:(ABI42_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  ABI42_0_0RCTSurface *surface = [[self class] createSurfaceWithBridge:bridge
                                                   moduleName:moduleName
                                            initialProperties:initialProperties];
  [surface start];
  return [self initWithSurface:surface sizeMeasureMode:sizeMeasureMode];
}

- (instancetype)initWithSurface:(ABI42_0_0RCTSurface *)surface sizeMeasureMode:(ABI42_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (self = [super initWithFrame:CGRectZero]) {
    _surface = surface;
    _sizeMeasureMode = sizeMeasureMode;

    _surface.delegate = self;
    _stage = surface.stage;
    [self _updateViews];
  }

  return self;
}

- (void)dealloc
{
  [_surface stop];
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];

  CGSize minimumSize;
  CGSize maximumSize;

  ABI42_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
      self.bounds.size, _sizeMeasureMode, &minimumSize, &maximumSize);

  [_surface setMinimumSize:minimumSize maximumSize:maximumSize];
}

- (CGSize)intrinsicContentSize
{
  if (ABI42_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return _activityIndicatorView.intrinsicContentSize;
    }

    return CGSizeZero;
  }

  return _surface.intrinsicSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (ABI42_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return [_activityIndicatorView sizeThatFits:size];
    }

    return CGSizeZero;
  }

  CGSize minimumSize;
  CGSize maximumSize;

  ABI42_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(size, _sizeMeasureMode, &minimumSize, &maximumSize);

  return [_surface sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];
}

- (void)setStage:(ABI42_0_0RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  BOOL shouldInvalidateLayout = ABI42_0_0RCTSurfaceStageIsRunning(stage) != ABI42_0_0RCTSurfaceStageIsRunning(_stage) ||
      ABI42_0_0RCTSurfaceStageIsPreparing(stage) != ABI42_0_0RCTSurfaceStageIsPreparing(_stage);

  _stage = stage;

  if (shouldInvalidateLayout) {
    [self _invalidateLayout];
    [self _updateViews];
  }
}

- (void)setSizeMeasureMode:(ABI42_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
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

  _isActivityIndicatorViewVisible = visible;

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

  _isSurfaceViewVisible = visible;

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

- (void)setActivityIndicatorViewFactory:(ABI42_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory)activityIndicatorViewFactory
{
  _activityIndicatorViewFactory = activityIndicatorViewFactory;
  if (_isActivityIndicatorViewVisible) {
    self.isActivityIndicatorViewVisible = NO;
    self.isActivityIndicatorViewVisible = YES;
  }
}

#pragma mark - UITraitCollection updates

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
  [[NSNotificationCenter defaultCenter]
      postNotificationName:ABI42_0_0RCTUserInterfaceStyleDidChangeNotification
                    object:self
                  userInfo:@{
                    ABI42_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : self.traitCollection,
                  }];
}

#pragma mark - Private stuff

- (void)_invalidateLayout
{
  [self invalidateIntrinsicContentSize];
  [self.superview setNeedsLayout];
}

- (void)_updateViews
{
  self.isSurfaceViewVisible = ABI42_0_0RCTSurfaceStageIsRunning(_stage);
  self.isActivityIndicatorViewVisible = ABI42_0_0RCTSurfaceStageIsPreparing(_stage);
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self _updateViews];
}

#pragma mark - ABI42_0_0RCTSurfaceDelegate

- (void)surface:(__unused ABI42_0_0RCTSurface *)surface didChangeStage:(ABI42_0_0RCTSurfaceStage)stage
{
  ABI42_0_0RCTExecuteOnMainQueue(^{
    [self setStage:stage];
  });
}

- (void)surface:(__unused ABI42_0_0RCTSurface *)surface didChangeIntrinsicSize:(__unused CGSize)intrinsicSize
{
  ABI42_0_0RCTExecuteOnMainQueue(^{
    [self _invalidateLayout];
  });
}

@end
