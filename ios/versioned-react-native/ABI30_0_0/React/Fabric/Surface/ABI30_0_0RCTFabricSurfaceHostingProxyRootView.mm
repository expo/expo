/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI30_0_0RCTFabricSurface.h"

@implementation ABI30_0_0RCTFabricSurfaceHostingProxyRootView

- (ABI30_0_0RCTSurface *)createSurfaceWithBridge:(ABI30_0_0RCTBridge *)bridge moduleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI30_0_0RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
