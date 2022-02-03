/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGDefsManager.h"
#import "ABI42_0_0RNSVGDefs.h"

@implementation ABI42_0_0RNSVGDefsManager

ABI42_0_0RCT_EXPORT_MODULE()

- (ABI42_0_0RNSVGDefs *)node
{
  return [ABI42_0_0RNSVGDefs new];
}

- (ABI42_0_0RNSVGView *)view
{
    return [self node];
}

@end
