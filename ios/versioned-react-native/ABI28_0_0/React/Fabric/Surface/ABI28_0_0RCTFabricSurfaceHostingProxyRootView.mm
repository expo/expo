/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTFabricSurfaceHostingProxyRootView.h"

#import "ABI28_0_0RCTFabricSurface.h"

@implementation ABI28_0_0RCTFabricSurfaceHostingProxyRootView

- (ABI28_0_0RCTSurface *)createSurfaceWithBridge:(ABI28_0_0RCTBridge *)bridge moduleName:(NSString *)moduleName initialProperties:(NSDictionary *)initialProperties
{
  return [[ABI28_0_0RCTFabricSurface alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

@end
