/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTSurfaceView.h"
#import "ABI44_0_0RCTSurfaceView+Internal.h"

#import "ABI44_0_0RCTDefines.h"
#import "ABI44_0_0RCTSurface.h"
#import "ABI44_0_0RCTSurfaceRootView.h"

@implementation ABI44_0_0RCTSurfaceView {
  ABI44_0_0RCTSurfaceRootView *_Nullable _rootView;
  ABI44_0_0RCTSurfaceStage _stage;
}

ABI44_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)
ABI44_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI44_0_0RCT_NOT_IMPLEMENTED(-(nullable instancetype)initWithCoder : (NSCoder *)coder)

- (instancetype)initWithSurface:(ABI44_0_0RCTSurface *)surface
{
  if (self = [super initWithFrame:CGRectZero]) {
    _stage = surface.stage;
    _surface = surface;
  }

  return self;
}

#pragma mark - Internal Interface

- (void)setRootView:(ABI44_0_0RCTSurfaceRootView *_Nullable)rootView
{
  if (_rootView == rootView) {
    return;
  }

  [_rootView removeFromSuperview];
  _rootView = rootView;
  [self _updateStage];
}

- (ABI44_0_0RCTSurfaceRootView *)rootView
{
  return _rootView;
}

#pragma mark - stage

- (void)setStage:(ABI44_0_0RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  _stage = stage;

  [self _updateStage];
}

- (ABI44_0_0RCTSurfaceStage)stage
{
  return _stage;
}

#pragma mark - Private

- (void)_updateStage
{
  if (ABI44_0_0RCTSurfaceStageIsRunning(_stage)) {
    if (_rootView && _rootView.superview != self) {
      [self addSubview:_rootView];
    }
  } else {
    [_rootView removeFromSuperview];
  }
}

@end
