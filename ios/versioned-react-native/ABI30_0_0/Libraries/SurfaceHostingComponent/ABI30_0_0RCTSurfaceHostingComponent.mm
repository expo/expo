/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSurfaceHostingComponent.h"
#import "ABI30_0_0RCTSurfaceHostingComponent+Internal.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ReactABI30_0_0/ABI30_0_0RCTSurface.h>
#import <ReactABI30_0_0/ABI30_0_0RCTSurfaceView.h>

#import "ABI30_0_0RCTSurfaceHostingComponentController.h"
#import "ABI30_0_0RCTSurfaceHostingComponentState.h"

@implementation ABI30_0_0RCTSurfaceHostingComponent

+ (Class<CKComponentControllerProtocol>)controllerClass
{
  return [ABI30_0_0RCTSurfaceHostingComponentController class];
}

+ (id)initialState
{
  return [ABI30_0_0RCTSurfaceHostingComponentState new];
}

+ (instancetype)newWithSurface:(ABI30_0_0RCTSurface *)surface options:(ABI30_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, surface);

  ABI30_0_0RCTSurfaceHostingComponentState *const state = scope.state();

  ABI30_0_0RCTSurfaceHostingComponentState *const newState =
    [ABI30_0_0RCTSurfaceHostingComponentState newWithStage:surface.stage
                                     intrinsicSize:surface.intrinsicSize];

  if (![state isEqual:newState]) {
    CKComponentScope::replaceState(scope, newState);
  }

  ABI30_0_0RCTSurfaceHostingComponent *const component =
    [super newWithView:{[UIView class]} size:{}];

  if (component) {
    component->_state = scope.state();
    component->_surface = surface;
    component->_options = options;
  }

  return component;
}

- (CKComponentLayout)computeLayoutThatFits:(CKSizeRange)constrainedSize
{
  // Optimistically communicating layout constraints to the `_surface`,
  // just to provide layout constraints to ReactABI30_0_0 Native as early as possible.
  // ReactABI30_0_0 Native *may* use this info later during applying the own state and
  // related laying out in parallel with ComponentKit execution.
  // This call will not interfere (or introduce any negative side effects) with
  // following invocation of `sizeThatFitsMinimumSize:maximumSize:`.
  // A weak point: We assume here that this particular layout will be
  // mounted eventually, which is technically not guaranteed by ComponentKit.
  // Therefore we also assume that the last layout calculated in a sequence
  // will be mounted anyways, which is probably true for all *real* use cases.
  // We plan to tackle this problem during the next big step in improving
  // interop compatibilities of ReactABI30_0_0 Native which will enable us granularly
  // control ReactABI30_0_0 Native mounting blocks and, as a result, implement
  // truly synchronous mounting stage between ReactABI30_0_0 Native and ComponentKit.
  [_surface setMinimumSize:constrainedSize.min
               maximumSize:constrainedSize.max];

  // Just in case of the very first building pass, we give ReactABI30_0_0 Native a chance
  // to prepare its internals for coming synchronous measuring.
  [_surface synchronouslyWaitForStage:ABI30_0_0RCTSurfaceStageSurfaceDidInitialLayout
                              timeout:_options.synchronousLayoutingTimeout];

  CGSize fittingSize = CGSizeZero;
  if (_surface.stage & ABI30_0_0RCTSurfaceStageSurfaceDidInitialLayout) {
    fittingSize = [_surface sizeThatFitsMinimumSize:constrainedSize.min
                                        maximumSize:constrainedSize.max];
  }
  else {
    fittingSize = _options.activityIndicatorSize;
  }

  fittingSize = constrainedSize.clamp(fittingSize);
  return {self, fittingSize};
}

- (CKComponentBoundsAnimation)boundsAnimationFromPreviousComponent:(ABI30_0_0RCTSurfaceHostingComponent *)previousComponent
{
  if (_options.boundsAnimations && (previousComponent->_state.stage != _state.stage)) {
    return {
      .mode = CKComponentBoundsAnimationModeDefault,
      .duration = 0.25,
      .options = UIViewAnimationOptionCurveEaseInOut,
    };
  }

  return {};
}

@end
