/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI15_0_0RNSVGRadialGradientManager.h"
#import "ABI15_0_0RNSVGRadialGradient.h"

@implementation ABI15_0_0RNSVGRadialGradientManager

ABI15_0_0RCT_EXPORT_MODULE()

- (ABI15_0_0RNSVGNode *)node
{
  return [ABI15_0_0RNSVGRadialGradient new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fx, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fy, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(rx, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(ry, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(cx, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(cy, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSArray<NSNumber *>)

@end
