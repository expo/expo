/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSurfaceBackedComponent.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ComponentKit/CKOverlayLayoutComponent.h>
#import <ABI45_0_0RCTSurfaceHostingComponent/ABI45_0_0RCTSurfaceHostingComponent.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurface.h>

#import "ABI45_0_0RCTSurfaceBackedComponentState.h"

@implementation ABI45_0_0RCTSurfaceBackedComponent

+ (id)initialState
{
  return [ABI45_0_0RCTSurfaceBackedComponentState new];
}

+ (instancetype)newWithBridge:(ABI45_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI45_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, moduleName);

  ABI45_0_0RCTSurfaceBackedComponentState *state = scope.state();

  if (state.surface == nil || ![state.surface.moduleName isEqualToString:moduleName]) {
    ABI45_0_0RCTSurface *surface =
      [[ABI45_0_0RCTSurface alloc] initWithBridge:bridge
                              moduleName:moduleName
                       initialProperties:properties];

    [surface start];

    state = [ABI45_0_0RCTSurfaceBackedComponentState newWithSurface:surface];

    CKComponentScope::replaceState(scope, state);
  }
  else {
    if (![state.surface.properties isEqualToDictionary:properties]) {
      state.surface.properties = properties;
    }
  }

  ABI45_0_0RCTSurfaceHostingComponent *surfaceHostingComponent =
    [ABI45_0_0RCTSurfaceHostingComponent newWithSurface:state.surface
                                       options:options];

  CKComponent *component;
  if (options.activityIndicatorComponentFactory == nil || ABI45_0_0RCTSurfaceStageIsRunning(state.surface.stage)) {
    component = surfaceHostingComponent;
  } else {
    component = CK::OverlayLayoutComponentBuilder()
    .component(surfaceHostingComponent)
    .overlay(options.activityIndicatorComponentFactory())
    .build();
  }

  return [super newWithComponent:component];
}

@end
