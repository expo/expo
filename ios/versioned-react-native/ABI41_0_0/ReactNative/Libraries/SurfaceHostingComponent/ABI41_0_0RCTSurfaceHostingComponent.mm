/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSurfaceHostingComponent.h"
#import "ABI41_0_0RCTSurfaceHostingComponent+Internal.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurface.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfaceView.h>

#import "ABI41_0_0RCTSurfaceHostingComponentController.h"
#import "ABI41_0_0RCTSurfaceHostingComponentState.h"

@implementation ABI41_0_0RCTSurfaceHostingComponent

+ (Class<CKComponentControllerProtocol>)controllerClass
{
  return [ABI41_0_0RCTSurfaceHostingComponentController class];
}

+ (id)initialState
{
  return [ABI41_0_0RCTSurfaceHostingComponentState new];
}

+ (instancetype)newWithSurface:(ABI41_0_0RCTSurface *)surface options:(ABI41_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, surface);

  ABI41_0_0RCTSurfaceHostingComponentState *const state = scope.state();

  ABI41_0_0RCTSurfaceHostingComponentState *const newState =
    [ABI41_0_0RCTSurfaceHostingComponentState newWithStage:surface.stage
                                     intrinsicSize:surface.intrinsicSize];

  if (![state isEqual:newState]) {
    CKComponentScope::replaceState(scope, newState);
  }

  ABI41_0_0RCTSurfaceHostingComponent *const component =
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
  // just to provide layout constraints to ABI41_0_0React Native as early as possible.
  // ABI41_0_0React Native *may* use this info later during applying the own state and
  // related laying out in parallel with ComponentKit execution.
  // This call will not interfere (or introduce any negative side effects) with
  // following invocation of `sizeThatFitsMinimumSize:maximumSize:`.
  // A weak point: We assume here that this particular layout will be
  // mounted eventually, which is technically not guaranteed by ComponentKit.
  // Therefore we also assume that the last layout calculated in a sequence
  // will be mounted anyways, which is probably true for all *real* use cases.
  // We plan to tackle this problem during the next big step in improving
  // interop compatibilities of ABI41_0_0React Native which will enable us granularly
  // control ABI41_0_0React Native mounting blocks and, as a result, implement
  // truly synchronous mounting stage between ABI41_0_0React Native and ComponentKit.
  [_surface setMinimumSize:constrainedSize.min
               maximumSize:constrainedSize.max];

  // Just in case of the very first building pass, we give ABI41_0_0React Native a chance
  // to prepare its internals for coming synchronous measuring.
  [_surface synchronouslyWaitForStage:ABI41_0_0RCTSurfaceStageSurfaceDidInitialLayout
                              timeout:_options.synchronousLayoutingTimeout];

  CGSize fittingSize = CGSizeZero;
  if (_surface.stage & ABI41_0_0RCTSurfaceStageSurfaceDidInitialLayout) {
    fittingSize = [_surface sizeThatFitsMinimumSize:constrainedSize.min
                                        maximumSize:constrainedSize.max];
  }
  else {
    fittingSize = _options.activityIndicatorSize;
  }

  fittingSize = constrainedSize.clamp(fittingSize);
  return {self, fittingSize};
}

- (CKComponentBoundsAnimation)boundsAnimationFromPreviousComponent:(ABI41_0_0RCTSurfaceHostingComponent *)previousComponent
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
