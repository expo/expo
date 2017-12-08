/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI24_0_0RNSVGDefsManager.h"
#import "ABI24_0_0RNSVGDefs.h"

@implementation ABI24_0_0RNSVGDefsManager

ABI24_0_0RCT_EXPORT_MODULE()

- (ABI24_0_0RNSVGDefs *)node
{
  return [ABI24_0_0RNSVGDefs new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI24_0_0RCTShadowView *)shadowView
{
    return nil;
}

@end
