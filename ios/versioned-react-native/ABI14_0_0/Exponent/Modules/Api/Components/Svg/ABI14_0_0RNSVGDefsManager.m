/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI14_0_0RNSVGDefsManager.h"
#import "ABI14_0_0RNSVGDefs.h"

@implementation ABI14_0_0RNSVGDefsManager

ABI14_0_0RCT_EXPORT_MODULE()

- (ABI14_0_0RNSVGDefs *)node
{
  return [ABI14_0_0RNSVGDefs new];
}

- (UIView *)view
{
    return [self node];
}

- (ABI14_0_0RCTShadowView *)shadowView
{
    return nil;
}

@end
