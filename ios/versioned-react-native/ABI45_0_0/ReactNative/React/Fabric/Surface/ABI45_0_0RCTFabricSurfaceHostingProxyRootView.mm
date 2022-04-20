/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI45_0_0RCTFabricSurface.h"

@implementation ABI45_0_0RCTFabricSurfaceHostingProxyRootView

+ (id<ABI45_0_0RCTSurfaceProtocol>)createSurfaceWithBridge:(ABI45_0_0RCTBridge *)bridge
                                       moduleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI45_0_0RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
