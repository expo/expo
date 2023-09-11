/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTSurfaceBackedComponent.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ComponentKit/CKOverlayLayoutComponent.h>
#import <ABI47_0_0RCTSurfaceHostingComponent/ABI47_0_0RCTSurfaceHostingComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTSurface.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricSurface.h>

#import "ABI47_0_0RCTSurfaceBackedComponentState.h"

@implementation ABI47_0_0RCTSurfaceBackedComponent

+ (id)initialState
{
  return [ABI47_0_0RCTSurfaceBackedComponentState new];
}

+ (instancetype)newWithBridge:(ABI47_0_0RCTBridge *)bridge
             surfacePresenter:(ABI47_0_0RCTSurfacePresenter *)surfacePresenter
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI47_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, moduleName);

  ABI47_0_0RCTSurfaceBackedComponentState *state = scope.state();

  // JavaScript entrypoints expects "fabric" key for Fabric surfaces
  NSMutableDictionary *adjustedProperties = [[NSMutableDictionary alloc] initWithDictionary:properties];
  adjustedProperties[@"fabric"] = surfacePresenter ? @YES : nil;

  if (state.surface == nil || ![state.surface.moduleName isEqualToString:moduleName]) {
    id<ABI47_0_0RCTSurfaceProtocol> surface;
    if (surfacePresenter) {
      surface = [[ABI47_0_0RCTFabricSurface alloc] initWithSurfacePresenter:surfacePresenter
                                              moduleName:moduleName
                                              initialProperties:adjustedProperties];
    } else {
      surface = [[ABI47_0_0RCTSurface alloc] initWithBridge:bridge
                                moduleName:moduleName
                         initialProperties:adjustedProperties];
    }
    [surface start];

    state = [ABI47_0_0RCTSurfaceBackedComponentState newWithSurface:surface];

    CKComponentScope::replaceState(scope, state);
  }
  else {
    if (![state.surface.properties isEqualToDictionary:adjustedProperties]) {
      state.surface.properties = adjustedProperties;
    }
  }

  ABI47_0_0RCTSurfaceHostingComponent *surfaceHostingComponent =
    [ABI47_0_0RCTSurfaceHostingComponent newWithSurface:state.surface
                                       options:options];

  CKComponent *component;
  if (options.activityIndicatorComponentFactory == nil || ABI47_0_0RCTSurfaceStageIsRunning(state.surface.stage)) {
    component = surfaceHostingComponent;
  } else {
    component = [[CKOverlayLayoutComponent alloc] initWithComponent:surfaceHostingComponent
                                                            overlay:options.activityIndicatorComponentFactory()];
  }

  return [super newWithComponent:component];
}

@end
