/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI42_0_0RCTFabricSurface.h"

@implementation ABI42_0_0RCTFabricSurfaceHostingProxyRootView

+ (ABI42_0_0RCTSurface *)createSurfaceWithBridge:(ABI42_0_0RCTBridge *)bridge
                             moduleName:(NSString *)moduleName
                      initialProperties:(NSDictionary *)initialProperties
{
  return (ABI42_0_0RCTSurface *)[[ABI42_0_0RCTFabricSurface alloc] initWithBridge:bridge
                                                     moduleName:moduleName
                                              initialProperties:initialProperties];
}

@end
