/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI46_0_0RCTFabricSurface.h"

@implementation ABI46_0_0RCTFabricSurfaceHostingProxyRootView

+ (id<ABI46_0_0RCTSurfaceProtocol>)createSurfaceWithBridge:(ABI46_0_0RCTBridge *)bridge
                                       moduleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI46_0_0RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
