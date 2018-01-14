/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceView.h"
#import "ABI25_0_0RCTSurfaceView+Internal.h"

#import "ABI25_0_0RCTDefines.h"
#import "ABI25_0_0RCTSurface.h"
#import "ABI25_0_0RCTSurfaceRootView.h"

@implementation ABI25_0_0RCTSurfaceView {
  ABI25_0_0RCTSurfaceRootView *_Nullable _rootView;
  ABI25_0_0RCTSurfaceStage _stage;
}

ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI25_0_0RCT_NOT_IMPLEMENTED(- (nullable instancetype)initWithCoder:(NSCoder *)coder)

- (instancetype)initWithSurface:(ABI25_0_0RCTSurface *)surface
{
  if (self = [super initWithFrame:CGRectZero]) {
    _stage = surface.stage;
    _surface = surface;
  }

  return self;
}

#pragma mark - Internal Interface

- (void)setRootView:(ABI25_0_0RCTSurfaceRootView *)rootView
{
  if (_rootView == rootView) {
    return;
  }

  [_rootView removeFromSuperview];
  _rootView = rootView;
  [self _updateStage];
}

- (ABI25_0_0RCTSurfaceRootView *)rootView
{
  return _rootView;
}

#pragma mark - stage

- (void)setStage:(ABI25_0_0RCTSurfaceStage)stage
{
  if (stage == _stage) {
    return;
  }

  _stage = stage;

  [self _updateStage];
}

- (ABI25_0_0RCTSurfaceStage)stage
{
  return _stage;
}

#pragma mark - Private

- (void)_updateStage
{
  if (ABI25_0_0RCTSurfaceStageIsRunning(_stage)) {
    if (_rootView.superview != self) {
      [self addSubview:_rootView];
    }
  }
  else {
    [_rootView removeFromSuperview];
  }
}

@end
