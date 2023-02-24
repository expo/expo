/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSurfaceHostingView.h"
#import "ABI47_0_0RCTConstants.h"
#import "ABI47_0_0RCTDefines.h"
#import "ABI47_0_0RCTSurface.h"
#import "ABI47_0_0RCTSurfaceDelegate.h"
#import "ABI47_0_0RCTSurfaceView.h"
#import "ABI47_0_0RCTUtils.h"

@interface ABI47_0_0RCTSurfaceHostingView ()

@property (nonatomic, assign) BOOL isActivityIndicatorViewVisible;
@property (nonatomic, assign) BOOL isSurfaceViewVisible;

@end

@implementation ABI47_0_0RCTSurfaceHostingView {
  UIView *_Nullable _activityIndicatorView;
  UIView *_Nullable _surfaceView;
  ABI47_0_0RCTSurfaceStage _stage;
}

+ (id<ABI47_0_0RCTSurfaceProtocol>)createSurfaceWithBridge:(ABI47_0_0RCTBridge *)bridge
                                       moduleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI47_0_0RCTSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)
ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI47_0_0RCT_NOT_IMPLEMENTED(-(nullable instancetype)initWithCoder : (NSCoder *)coder)

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
               sizeMeasureMode:(ABI47_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  id<ABI47_0_0RCTSurfaceProtocol> surface = [[self class] createSurfaceWithBridge:bridge
                                                              moduleName:moduleName
                                                       initialProperties:initialProperties];
  if (self = [self initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    [surface start];
  }
  return self;
}

- (instancetype)initWithSurface:(id<ABI47_0_0RCTSurfaceProtocol>)surface
                sizeMeasureMode:(ABI47_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  if (self = [super initWithFrame:CGRectZero]) {
    _surface = surface;
    _sizeMeasureMode = sizeMeasureMode;

    _surface.delegate = self;
    _stage = surface.stage;
    [self _updateViews];

    // For backward compatibility with ABI47_0_0RCTRootView, set a color here instead of transparent (OS default).
    self.backgroundColor = [UIColor whiteColor];
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

  ABI47_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
      self.bounds.size, _sizeMeasureMode, &minimumSize, &maximumSize);
  CGRect windowFrame = [self.window convertRect:self.frame fromView:self.superview];

  [_surface setMinimumSize:minimumSize maximumSize:maximumSize viewportOffset:windowFrame.origin];
}

- (CGSize)intrinsicContentSize
{
  if (ABI47_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return _activityIndicatorView.intrinsicContentSize;
    }

    return CGSizeZero;
  }

  return _surface.intrinsicSize;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (ABI47_0_0RCTSurfaceStageIsPreparing(_stage)) {
    if (_activityIndicatorView) {
      return [_activityIndicatorView sizeThatFits:size];
    }

    return CGSizeZero;
  }

  CGSize minimumSize;
  CGSize maximumSize;

  ABI47_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(size, _sizeMeasureMode, &minimumSize, &maximumSize);

  return [_surface sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];
}

- (void)setStage:(ABI47_0_0RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  BOOL shouldInvalidateLayout = ABI47_0_0RCTSurfaceStageIsRunning(stage) != ABI47_0_0RCTSurfaceStageIsRunning(_stage) ||
      ABI47_0_0RCTSurfaceStageIsPreparing(stage) != ABI47_0_0RCTSurfaceStageIsPreparing(_stage);

  _stage = stage;

  if (shouldInvalidateLayout) {
    [self _invalidateLayout];
    [self _updateViews];
  }
}

- (void)setSizeMeasureMode:(ABI47_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
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

- (void)setActivityIndicatorViewFactory:(ABI47_0_0RCTSurfaceHostingViewActivityIndicatorViewFactory)activityIndicatorViewFactory
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
      postNotificationName:ABI47_0_0RCTUserInterfaceStyleDidChangeNotification
                    object:self
                  userInfo:@{
                    ABI47_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : self.traitCollection,
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
  self.isSurfaceViewVisible = ABI47_0_0RCTSurfaceStageIsRunning(_stage);
  self.isActivityIndicatorViewVisible = ABI47_0_0RCTSurfaceStageIsPreparing(_stage);
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self _updateViews];
}

#pragma mark - ABI47_0_0RCTSurfaceDelegate

- (void)surface:(__unused ABI47_0_0RCTSurface *)surface didChangeStage:(ABI47_0_0RCTSurfaceStage)stage
{
  ABI47_0_0RCTExecuteOnMainQueue(^{
    [self setStage:stage];
  });
}

- (void)surface:(__unused ABI47_0_0RCTSurface *)surface didChangeIntrinsicSize:(__unused CGSize)intrinsicSize
{
  ABI47_0_0RCTExecuteOnMainQueue(^{
    [self _invalidateLayout];
  });
}

@end
