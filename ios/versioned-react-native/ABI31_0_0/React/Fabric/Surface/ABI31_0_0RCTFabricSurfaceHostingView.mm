/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTFabricSurfaceHostingView.h"

#import "ABI31_0_0RCTFabricSurface.h"

@implementation ABI31_0_0RCTFabricSurfaceHostingView

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
               sizeMeasureMode:(ABI31_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
{
  ABI31_0_0RCTSurface *surface = (ABI31_0_0RCTSurface *)[[ABI31_0_0RCTFabricSurface alloc] initWithBridge:bridge
                                                                    moduleName:moduleName
                                                             initialProperties:initialProperties];
  return [self initWithSurface:surface sizeMeasureMode:sizeMeasureMode];
}

@end

