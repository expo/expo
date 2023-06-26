/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGDefsManager.h"
#import "ABI49_0_0RNSVGDefs.h"

@implementation ABI49_0_0RNSVGDefsManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGDefs *)node
{
  return [ABI49_0_0RNSVGDefs new];
}

- (ABI49_0_0RNSVGView *)view
{
  return [self node];
}

@end
