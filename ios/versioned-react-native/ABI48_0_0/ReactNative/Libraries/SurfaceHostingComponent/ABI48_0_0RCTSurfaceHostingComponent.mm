/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSurfaceHostingComponent.h"
#import "ABI48_0_0RCTSurfaceHostingComponent+Internal.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricSurface.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurface.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceView.h>

#import "ABI48_0_0RCTSurfaceHostingComponentController.h"
#import "ABI48_0_0RCTSurfaceHostingComponentState.h"

@implementation ABI48_0_0RCTSurfaceHostingComponent

+ (Class<CKComponentControllerProtocol>)controllerClass
{
  return [ABI48_0_0RCTSurfaceHostingComponentController class];
}

+ (id)initialState
{
  return [ABI48_0_0RCTSurfaceHostingComponentState new];
}

+ (instancetype)newWithSurface:(id<ABI48_0_0RCTSurfaceProtocol>)surface options:(ABI48_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, surface);

  ABI48_0_0RCTSurfaceHostingComponentState *const state = scope.state();

  ABI48_0_0RCTSurfaceHostingComponentState *const newState =
      [ABI48_0_0RCTSurfaceHostingComponentState newWithStage:surface.stage intrinsicSize:surface.intrinsicSize];

  if (![state isEqual:newState]) {
    CKComponentScope::replaceState(scope, newState);
  }

  ABI48_0_0RCTSurfaceHostingComponent *const component = [super newWithView:{[UIView class]} size:{}];

  if (component) {
    component->_state = scope.state();
    component->_surface = surface;
    component->_options = options;
  }

  return component;
}

- (RCLayout)computeLayoutThatFits:(CKSizeRange)constrainedSize
{
  // Optimistically communicating layout constraints to the `_surface`,
  // just to provide layout constraints to ABI48_0_0React Native as early as possible.
  // ABI48_0_0React Native *may* use this info later during applying the own state and
  // related laying out in parallel with ComponentKit execution.
  // This call will not interfere (or introduce any negative side effects) with
  // following invocation of `sizeThatFitsMinimumSize:maximumSize:`.
  // A weak point: We assume here that this particular layout will be
  // mounted eventually, which is technically not guaranteed by ComponentKit.
  // Therefore we also assume that the last layout calculated in a sequence
  // will be mounted anyways, which is probably true for all *real* use cases.
  // We plan to tackle this problem during the next big step in improving
  // interop compatibilities of ABI48_0_0React Native which will enable us granularly
  // control ABI48_0_0React Native mounting blocks and, as a result, implement
  // truly synchronous mounting stage between ABI48_0_0React Native and ComponentKit.
  [_surface setMinimumSize:constrainedSize.min maximumSize:constrainedSize.max];

  // Just in case of the very first building pass, we give ABI48_0_0React Native a chance
  // to prepare its internals for coming synchronous measuring.
  if ([_surface isKindOfClass:[ABI48_0_0RCTSurface class]]) {
    // Legacy Pre-Fabric Surface
    [(ABI48_0_0RCTSurface *)_surface synchronouslyWaitForStage:ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout
                                              timeout:_options.synchronousLayoutingTimeout];
  } else if ([_surface isKindOfClass:[ABI48_0_0RCTFabricSurface class]]) {
    // Fabric Surface
    // Hack: Increase timeout because ABI48_0_0RCTFabricSurface stage will be ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout
    // before mounting has finished, which can cause sizeThatFitsMinimumSize to return the wrong value.
    // Safe hack because timeout length can be increased without making the component seem slower.
    // However if timeout length is less than the time to mount a surface, the size may be incorrect.
    // TODO (T115399546) Allow ABI48_0_0RCTFabricSurface synchronouslyWaitFor to wait for mounting completion stage
    NSTimeInterval timeout = 20;
    [(ABI48_0_0RCTFabricSurface *)_surface synchronouslyWaitFor:timeout];
  }

  CGSize fittingSize = CGSizeZero;
  if (_surface.stage & ABI48_0_0RCTSurfaceStageSurfaceDidInitialLayout) {
    fittingSize = [_surface sizeThatFitsMinimumSize:constrainedSize.min maximumSize:constrainedSize.max];
  } else {
    fittingSize = _options.activityIndicatorSize;
  }

  fittingSize = constrainedSize.clamp(fittingSize);
  return {self, fittingSize};
}

- (CKComponentBoundsAnimation)boundsAnimationFromPreviousComponent:(ABI48_0_0RCTSurfaceHostingComponent *)previousComponent
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
