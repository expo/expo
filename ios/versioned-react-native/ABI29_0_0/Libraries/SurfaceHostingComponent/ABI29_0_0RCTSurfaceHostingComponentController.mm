/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSurfaceHostingComponentController.h"

#import <ComponentKit/CKComponentSubclass.h>
#import <ReactABI29_0_0/ABI29_0_0RCTAssert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTSurface.h>
#import <ReactABI29_0_0/ABI29_0_0RCTSurfaceDelegate.h>
#import <ReactABI29_0_0/ABI29_0_0RCTSurfaceView.h>

#import "ABI29_0_0RCTSurfaceHostingComponent+Internal.h"
#import "ABI29_0_0RCTSurfaceHostingComponent.h"
#import "ABI29_0_0RCTSurfaceHostingComponentState.h"

@interface ABI29_0_0RCTSurfaceHostingComponentController() <ABI29_0_0RCTSurfaceDelegate>
@end

@implementation ABI29_0_0RCTSurfaceHostingComponentController {
  ABI29_0_0RCTSurface *_surface;
}

- (instancetype)initWithComponent:(ABI29_0_0RCTSurfaceHostingComponent *)component
{
  if (self = [super initWithComponent:component]) {
    [self updateSurfaceWithComponent:component];
  }

  return self;
}

#pragma mark - Lifecycle

- (void)didMount
{
  [super didMount];
  [self mountSurfaceView];
}

- (void)didRemount
{
  [super didRemount];
  [self mountSurfaceView];
}

- (void)didUpdateComponent
{
  [super didUpdateComponent];
  [self updateSurfaceWithComponent:(ABI29_0_0RCTSurfaceHostingComponent *)self.component];
}

- (void)didUnmount
{
  [super didUnmount];
  [self unmountSurfaceView];
}

#pragma mark - Helpers

- (void)updateSurfaceWithComponent:(ABI29_0_0RCTSurfaceHostingComponent *)component
{
  // Updating `surface`
  ABI29_0_0RCTSurface *const surface = component.surface;
  if (surface != _surface) {
    if (_surface.delegate == self) {
      _surface.delegate = nil;
    }

    _surface = surface;
    _surface.delegate = self;
  }
}

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  [self.component updateState:^(ABI29_0_0RCTSurfaceHostingComponentState *state) {
    return [ABI29_0_0RCTSurfaceHostingComponentState newWithStage:state.stage
                                           intrinsicSize:intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (void)setStage:(ABI29_0_0RCTSurfaceStage)stage
{
  [self.component updateState:^(ABI29_0_0RCTSurfaceHostingComponentState *state) {
    return [ABI29_0_0RCTSurfaceHostingComponentState newWithStage:stage
                                           intrinsicSize:state.intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (CKUpdateMode)suitableStateUpdateMode
{
  return ((ABI29_0_0RCTSurfaceHostingComponent *)self.component).options.synchronousStateUpdates && ABI29_0_0RCTIsMainQueue() ? CKUpdateModeSynchronous : CKUpdateModeAsynchronous;
}

- (void)mountSurfaceView
{
  UIView *const surfaceView = _surface.view;

  const CKComponentViewContext &context = [[self component] viewContext];

  UIView *const superview = context.view;
  superview.clipsToBounds = YES;

  ABI29_0_0RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");

  UIView *const existingSurfaceView = [superview.subviews lastObject];
  if (existingSurfaceView != surfaceView) {
    [existingSurfaceView removeFromSuperview];
    surfaceView.frame = superview.bounds;
    surfaceView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [superview addSubview:surfaceView];
  }
}

- (void)unmountSurfaceView
{
  const CKComponentViewContext &context = [[self component] viewContext];

  UIView *const superview = context.view;
  ABI29_0_0RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");
  UIView *const existingSurfaceView = [superview.subviews lastObject];
  [existingSurfaceView removeFromSuperview];
}

#pragma mark - ABI29_0_0RCTSurfaceDelegate

- (void)surface:(ABI29_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [self setIntrinsicSize:intrinsicSize];
}

- (void)surface:(ABI29_0_0RCTSurface *)surface didChangeStage:(ABI29_0_0RCTSurfaceStage)stage
{
  [self setStage:stage];
}

@end
