/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSurfaceBackedComponent.h"

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponentSubclass.h>
#import <ComponentKit/CKOverlayLayoutComponent.h>
#import <ABI28_0_0RCTSurfaceHostingComponent/ABI28_0_0RCTSurfaceHostingComponent.h>
#import <ReactABI28_0_0/ABI28_0_0RCTSurface.h>

#import "ABI28_0_0RCTSurfaceBackedComponentState.h"

@implementation ABI28_0_0RCTSurfaceBackedComponent

+ (id)initialState
{
  return [ABI28_0_0RCTSurfaceBackedComponentState new];
}

+ (instancetype)newWithBridge:(ABI28_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI28_0_0RCTSurfaceHostingComponentOptions)options
{
  CKComponentScope scope(self, moduleName);

  ABI28_0_0RCTSurfaceBackedComponentState *state = scope.state();

  if (state.surface == nil || state.surface.bridge != bridge || ![state.surface.moduleName isEqualToString:moduleName]) {
    ABI28_0_0RCTSurface *surface =
      [[ABI28_0_0RCTSurface alloc] initWithBridge:bridge
                              moduleName:moduleName
                       initialProperties:properties];

    state = [ABI28_0_0RCTSurfaceBackedComponentState newWithSurface:surface];

    CKComponentScope::replaceState(scope, state);
  }
  else {
    if (![state.surface.properties isEqualToDictionary:properties]) {
      state.surface.properties = properties;
    }
  }

  ABI28_0_0RCTSurfaceHostingComponent *surfaceHostingComponent =
    [ABI28_0_0RCTSurfaceHostingComponent newWithSurface:state.surface
                                       options:options];

  CKComponent *component;
  if (options.activityIndicatorComponentFactory == nil || ABI28_0_0RCTSurfaceStageIsRunning(state.surface.stage)) {
    component = surfaceHostingComponent;
  } else {
    component = [CKOverlayLayoutComponent newWithComponent:surfaceHostingComponent
                                                   overlay:options.activityIndicatorComponentFactory()];
  }

  return [super newWithComponent:component];
}

@end
