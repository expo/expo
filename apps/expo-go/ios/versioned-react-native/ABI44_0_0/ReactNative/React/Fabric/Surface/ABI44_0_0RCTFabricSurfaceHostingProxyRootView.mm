/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI44_0_0RCTFabricSurface.h"

@implementation ABI44_0_0RCTFabricSurfaceHostingProxyRootView

+ (id<ABI44_0_0RCTSurfaceProtocol>)createSurfaceWithBridge:(ABI44_0_0RCTBridge *)bridge
                                       moduleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI44_0_0RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
