/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSurfaceHostingComponentController.h"

#import <ComponentKit/CKComponentSubclass.h>
#import <ReactABI30_0_0/ABI30_0_0RCTAssert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTSurface.h>
#import <ReactABI30_0_0/ABI30_0_0RCTSurfaceDelegate.h>
#import <ReactABI30_0_0/ABI30_0_0RCTSurfaceView.h>

#import "ABI30_0_0RCTSurfaceHostingComponent+Internal.h"
#import "ABI30_0_0RCTSurfaceHostingComponent.h"
#import "ABI30_0_0RCTSurfaceHostingComponentState.h"

@interface ABI30_0_0RCTSurfaceHostingComponentController() <ABI30_0_0RCTSurfaceDelegate>
@end

@implementation ABI30_0_0RCTSurfaceHostingComponentController {
  ABI30_0_0RCTSurface *_surface;
}

- (instancetype)initWithComponent:(ABI30_0_0RCTSurfaceHostingComponent *)component
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
  [self updateSurfaceWithComponent:(ABI30_0_0RCTSurfaceHostingComponent *)self.component];
}

- (void)didUnmount
{
  [super didUnmount];
  [self unmountSurfaceView];
}

#pragma mark - Helpers

- (void)updateSurfaceWithComponent:(ABI30_0_0RCTSurfaceHostingComponent *)component
{
  // Updating `surface`
  ABI30_0_0RCTSurface *const surface = component.surface;
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
  [self.component updateState:^(ABI30_0_0RCTSurfaceHostingComponentState *state) {
    return [ABI30_0_0RCTSurfaceHostingComponentState newWithStage:state.stage
                                           intrinsicSize:intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (void)setStage:(ABI30_0_0RCTSurfaceStage)stage
{
  [self.component updateState:^(ABI30_0_0RCTSurfaceHostingComponentState *state) {
    return [ABI30_0_0RCTSurfaceHostingComponentState newWithStage:stage
                                           intrinsicSize:state.intrinsicSize];
  } mode:[self suitableStateUpdateMode]];
}

- (CKUpdateMode)suitableStateUpdateMode
{
  return ((ABI30_0_0RCTSurfaceHostingComponent *)self.component).options.synchronousStateUpdates && ABI30_0_0RCTIsMainQueue() ? CKUpdateModeSynchronous : CKUpdateModeAsynchronous;
}

- (void)mountSurfaceView
{
  UIView *const surfaceView = _surface.view;

  const CKComponentViewContext &context = [[self component] viewContext];

  UIView *const superview = context.view;
  superview.clipsToBounds = YES;

  ABI30_0_0RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");

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
  ABI30_0_0RCTAssert([superview.subviews count] <= 1, @"Should never have more than a single stateful subview.");
  UIView *const existingSurfaceView = [superview.subviews lastObject];
  [existingSurfaceView removeFromSuperview];
}

#pragma mark - ABI30_0_0RCTSurfaceDelegate

- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [self setIntrinsicSize:intrinsicSize];
}

- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeStage:(ABI30_0_0RCTSurfaceStage)stage
{
  [self setStage:stage];
}

@end
